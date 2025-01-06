import { Task, SlidingTaskMap } from 'promise-based-task';
import { BaseCache } from './base.js';
import { Serializable } from '../internals/serializable.js';

var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
let SlidingCacheEntry = class SlidingCacheEntry2 extends Serializable {
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
    if (this.value instanceof Task) {
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
class SlidingCache extends BaseCache {
  static {
    __name(this, "SlidingCache");
  }
  provider;
  constructor(input) {
    super();
    this.provider = new SlidingTaskMap(input.size, input.ttl);
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

export { SlidingCache };
//# sourceMappingURL=slidingCache.js.map
//# sourceMappingURL=slidingCache.js.map