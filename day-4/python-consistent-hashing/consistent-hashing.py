# from sortedcontainers import SortedDict
import hashlib


# must use hashlib as it is idempotent across processes, whilst python's built-in hash function is not
def stable_hash(key: str) -> int:
    str_bytes = bytes(key, "UTF-8")
    m = hashlib.md5(str_bytes)
    return int(m.hexdigest(), base=16)


print("Stable hash of 'hello':", stable_hash("hello"))
