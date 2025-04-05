```elixir
# Start the rate limiter
{:ok, pid} = RateLimiter.start_link()

# Configure some rules
RateLimiter.configure_rule(:ip, "192.168.1.1", 100, 60)  # 100 req/minute
RateLimiter.configure_rule(:endpoint, "/api/users", 50, 30)  # 50 req/30s

# Check if request is allowed
case RateLimiter.allow?("192.168.1.1", "/api/users") do
  {:ok, remaining} ->
    IO.puts("Allowed! Remaining requests: #{remaining}")
  {:error, :rate_limited} ->
    IO.puts("Rate limited!")
end
```

# Key features of this implementation:

    ETS Usage: Uses :ordered_set for the rate limits table to handle race conditions safely.
    Sliding Window Counter: Implements a sliding window by tracking timestamps and cleaning old entries.
    Distributed System Support:
        Uses node monitoring and broadcasting for consistency
        ETS tables are public and accessible across nodes
        Updates are propagated to all connected nodes
    Flexible Rules:
        Supports both IP-based and endpoint-based limiting
        Rules can be configured dynamically
        Applies the strictest applicable rule when multiple apply
    Race Condition Handling:
        ETS operations are atomic
        Ordered set ensures consistent ordering of timestamps
        Single GenServer process handles rule updates
    Consistency:
        Broadcasts updates to all nodes
        Uses ETS for fast, atomic operations
        Maintains state across cluster

# To use this in a real production environment, you'd need to:

    Add proper error handling
    Implement more sophisticated cluster synchronization (e.g., using Distributed Erlang or a consensus protocol)
    Add monitoring and metrics
    Add persistence for rules if needed
    Configure appropriate garbage collection for ETS tables

The sliding window counter algorithm was chosen over the log algorithm because:

    It uses less memory (only counts instead of storing all timestamps)
    It's faster for lookups
    It provides good accuracy for rate limiting purposes
