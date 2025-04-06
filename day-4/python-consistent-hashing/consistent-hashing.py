class TreeMap:
    def __init__(self):
        self.tree = {}

    def put(self, key, value):
        self.tree[key] = value

    def get(self, key):
        return self.tree.get(key)

    def lower_key(self, key):
        lower_keys = [k for k in self.tree if k < key]
        return max(lower_keys) if lower_keys else None

    def higher_key(self, key):
        higher_keys = [k for k in self.tree if k > key]
        return min(higher_keys) if higher_keys else None

    def __repr__(self):
        return str(self.tree)


bst = TreeMap()

for i in range(0, 150, 5):
    bst.put(i, f"Value {i}")

print(bst)
print(bst.get(50))
print(bst.lower_key(10))
print(bst.higher_key(10))
