'use strict';

var promiseBasedTask = require('promise-based-task');
var base_cjs = require('./base.cjs');
var serializable_cjs = require('../internals/serializable.cjs');

var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
let SlidingCacheEntry = class SlidingCacheEntry2 extends serializable_cjs.Serializable {
  static {
    __name(this, "SlidingCacheEntry");
  }
  value;
  constructor(value) {
    super(), this.value = value;
  }
  static {
    this.register();
  }
  destructor() {
    if (this.value instanceof promiseBasedTask.Task) {
      this.value.destructor();
    }
  }
  unwrap() {
    return this.value;
  }
  createSnapshot() {
    return {
      value: this.value
    };
  }
  loadSnapshot(snapshot) {
    Object.assign(this, snapshot);
  }
};
class SlidingCache extends base_cjs.BaseCache {
  static {
    __name(this, "SlidingCache");
  }
  provider;
  constructor(input) {
    super();
    this.provider = new promiseBasedTask.SlidingTaskMap(input.size, input.ttl);
  }
  static {
    this.register();
  }
  async get(key) {
    const value = this.provider.get(key);
    return value?.unwrap?.();
  }
  async has(key) {
    return this.provider.has(key);
  }
  async clear() {
    this.provider.clear();
  }
  async delete(key) {
    return this.provider.delete(key);
  }
  async set(key, value) {
    this.provider.set(key, new SlidingCacheEntry(value));
  }
  async size() {
    return this.provider.size;
  }
  createSnapshot() {
    return {
      enabled: this.enabled,
      provider: this.provider
    };
  }
  loadSnapshot(snapshot) {
    Object.assign(this, snapshot);
  }
}

exports.SlidingCache = SlidingCache;
//# sourceMappingURL=slidingCache.cjs.map
//# sourceMappingURL=slidingCache.cjs.map