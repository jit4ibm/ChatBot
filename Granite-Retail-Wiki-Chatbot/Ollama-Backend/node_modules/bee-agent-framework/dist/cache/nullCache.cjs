'use strict';

var base_cjs = require('./base.cjs');

var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
class NullCache extends base_cjs.BaseCache {
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

exports.NullCache = NullCache;
//# sourceMappingURL=nullCache.cjs.map
//# sourceMappingURL=nullCache.cjs.map