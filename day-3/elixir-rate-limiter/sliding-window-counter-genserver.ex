defmodule RateLimiter do
  @moduledoc """
  A distributed rate limiter using ETS with sliding window counter algorithm.
  Supports both IP and endpoint-based rate limiting with flexible rule configuration.
  """

  use GenServer

  # Client API

  def start_link(_opts \\ []) do
    GenServer.start_link(__MODULE__, :ok, name: __MODULE__)
  end

  @doc """
  Check if a request is allowed based on IP and endpoint.
  Returns {:ok, remaining} or {:error, :rate_limited}
  """
  def allow?(ip, endpoint) do
    GenServer.call(__MODULE__, {:allow, ip, endpoint})
  end

  @doc """
  Configure rate limiting rules
  Example: configure_rule(:ip, "192.168.1.1", 100, 60) # 100 requests per minute
           configure_rule(:endpoint, "/api/v1/users", 50, 30) # 50 requests per 30s
  """
  def configure_rule(type, key, limit, window_seconds) do
    GenServer.call(__MODULE__, {:configure_rule, type, key, limit, window_seconds})
  end

  # Server Callbacks

  def init(:ok) do
    # Create ETS table with ordered_set for handling race conditions
    :ets.new(:rate_limits, [:named_table, :public, :ordered_set])
    :ets.new(:rules, [:named_table, :public, :set])

    # Setup cluster synchronization
    :net_kernel.monitor_nodes(true)

    {:ok, %{nodes: MapSet.new([Node.self()])}}
  end

  def handle_call({:allow, ip, endpoint}, _from, state) do
    now = System.os_time(:millisecond)
    # default 1 minute window
    window = 60_000

    # Get rules
    ip_rule = get_rule(:ip, ip)
    endpoint_rule = get_rule(:endpoint, endpoint)

    # Use strictest applicable rule
    {limit, window} =
      case {ip_rule, endpoint_rule} do
        # default rule
        {nil, nil} ->
          {100, window}

        {nil, {e_limit, e_window}} ->
          {e_limit, e_window}

        {{i_limit, i_window}, nil} ->
          {i_limit, i_window}

        {{i_limit, i_window}, {e_limit, e_window}} ->
          if i_limit / window < e_limit / e_window do
            {i_limit, i_window}
          else
            {e_limit, e_window}
          end
      end

    # Generate unique key for this request
    key = "#{ip}:#{endpoint}"

    # Clean old entries and count requests in window
    count = count_requests(key, now, window)
    remaining = limit - count

    if remaining > 0 do
      # Record new request with atomic increment
      :ets.insert(:rate_limits, {make_key(key, now), now})
      broadcast_to_nodes({:update, key, now})
      {:reply, {:ok, remaining - 1}, state}
    else
      {:reply, {:error, :rate_limited}, state}
    end
  end

  def handle_call({:configure_rule, type, key, limit, window_seconds}, _from, state) do
    :ets.insert(:rules, {{type, key}, {limit, window_seconds * 1000}})
    broadcast_to_nodes({:rule_update, type, key, limit, window_seconds})
    {:reply, :ok, state}
  end

  # Handle node events for distributed consistency
  def handle_info({:nodeup, node}, state) do
    {:noreply, %{state | nodes: MapSet.put(state.nodes, node)}}
  end

  def handle_info({:nodedown, node}, state) do
    {:noreply, %{state | nodes: MapSet.delete(state.nodes, node)}}
  end

  def handle_info({:update, key, timestamp}, state) do
    :ets.insert(:rate_limits, {make_key(key, timestamp), timestamp})
    {:noreply, state}
  end

  def handle_info({:rule_update, type, key, limit, window_seconds}, state) do
    :ets.insert(:rules, {{type, key}, {limit, window_seconds * 1000}})
    {:noreply, state}
  end

  # Private helper functions

  defp make_key(key, timestamp), do: {key, timestamp}

  defp count_requests(key, now, window) do
    min_time = now - window
    match_spec = [{{:"$1", :"$2"}, [{:>=, :"$2", min_time}], [true]}]

    # Atomic cleanup and count
    :ets.select_delete(:rate_limits, [{{:"$1", :"$2"}, [{:<, :"$2", min_time}], [true]}])
    :ets.select_count(:rate_limits, match_spec)
  end

  defp get_rule(type, key) do
    case :ets.lookup(:rules, {type, key}) do
      [{{^type, ^key}, rule}] -> rule
      [] -> nil
    end
  end

  defp broadcast_to_nodes(message) do
    # In a real distributed system, you'd use proper clustering
    # This is a simplified version
    nodes = Node.list()

    Enum.each(nodes, fn node ->
      send({__MODULE__, node}, message)
    end)
  end
end
