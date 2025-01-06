import { BaseCache } from './base.js';

var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
class NullCache extends BaseCache {
  static {
    __name(this, "NullCache");
  }
  enabled = false;
  async set(_key, _value) {
  }
  async get(_key) {
    return void 0;
  }
  async has(_key) {
    return false;
  }
  async delete(_key) {
    return true;
  }
  async clear() {
  }
  async size() {
    return 0;
  }
  createSnapshot() {
    return {
      enabled: this.enabled
    };
  }
  loadSnapshot(snapshot) {
    Object.assign(this, snapshot);
  }
}

export { NullCache };
//# sourceMappingURL=nullCache.js.map
//# sourceMappingURL=nullCache.js.map