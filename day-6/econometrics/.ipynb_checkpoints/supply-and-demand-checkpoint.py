import numpy as np
import matplotlib.pyplot as plt


# Define supply and demand functions
def demand(price, a=100, b=2):
    return a - b * price


def supply(price, c=20, d=1):
    return c + d * price


# Find equilibrium
def find_equilibrium(a=100, b=2, c=20, d=1):
    # Q_d = Q_s => a - bP = c + dP
    # P = (a - c) / (b + d)
    eq_price = (a - c) / (b + d)
    eq_quantity = demand(eq_price, a, b)  # or supply(eq_price, c, d)
    return eq_price, eq_quantity


# Parameters
a, b = 100, 2  # Demand: Q_d = 100 - 2P
c, d = 20, 1  # Supply: Q_s = 20 + P

# Calculate equilibrium
eq_price, eq_quantity = find_equilibrium(a, b, c, d)
print(f"Equilibrium Price: {eq_price:.2f}")
print(f"Equilibrium Quantity: {eq_quantity:.2f}")

# Plotting
prices = np.linspace(0, 50, 100)
demand_quantities = demand(prices, a, b)
supply_quantities = supply(prices, c, d)

plt.plot(prices, demand_quantities, label="Demand")
plt.plot(prices, supply_quantities, label="Supply")
plt.plot(eq_price, eq_quantity, "ro", label="Equilibrium")
plt.xlabel("Price")
plt.ylabel("Quantity")
plt.title("Supply and Demand")
plt.legend()
plt.grid(True)
plt.show()
