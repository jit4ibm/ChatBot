var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
function isWeakKey(value) {
  return value != null && typeof value === "object";
}
__name(isWeakKey, "isWeakKey");
class SafeWeakSet extends WeakSet {
  static {
    __name(this, "SafeWeakSet");
  }
  has(value) {
    if (isWeakKey(value)) {
      return super.has(value);
    }
    return false;
  }
  add(value) {
    if (isWeakKey(value)) {
      super.add(value);
    }
    return this;
  }
  delete(value) {
    if (isWeakKey(value)) {
      return super.delete(value);
    }
    return false;
  }
}
class SafeWeakMap extends WeakMap {
  static {
    __name(this, "SafeWeakMap");
  }
  has(value) {
    if (isWeakKey(value)) {
      return super.has(value);
    }
    return false;
  }
  get(key) {
    if (isWeakKey(key)) {
      return super.get(key);
    }
  }
  set(key, value) {
    if (isWeakKey(key)) {
      super.set(key, value);
    }
    return this;
  }
  delete(value) {
    if (isWeakKey(value)) {
      return super.delete(value);
    }
    return false;
  }
}

export { SafeWeakMap, SafeWeakSet, isWeakKey };
//# sourceMappingURL=weakRef.js.map
//# sourceMappingURL=weakRef.js.map