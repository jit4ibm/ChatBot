import * as R from 'remeda';
import hash from 'object-hash';
import { createRandomHash, createHash } from '../internals/helpers/hash.js';
import { findDescriptor } from '../internals/helpers/prototype.js';

var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
function _ts_decorate(decorators, target, key, desc) {
  var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
  if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
  else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
  return c > 3 && r && Object.defineProperty(target, key, r), r;
}
__name(_ts_decorate, "_ts_decorate");
function _ts_metadata(k, v) {
  if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
}
__name(_ts_metadata, "_ts_metadata");
const state = {
  container: /* @__PURE__ */ new WeakMap(),
  extractDescriptor(descriptor) {
    if (descriptor.value != null) {
      return {
        value: descriptor.value,
        update: /* @__PURE__ */ __name((value) => {
          descriptor.value = value;
        }, "update")
      };
    }
    if (descriptor.get != null) {
      return {
        value: descriptor.get,
        update: /* @__PURE__ */ __name((value) => {
          descriptor.get = value;
        }, "update")
      };
    }
    throw new Error(`@${Cache.name} decorator must be either on a method or get accessor.`);
  },
  getInstanceContext(target, ctx) {
    if (!ctx.instances.has(target)) {
      ctx.instances.set(target, {
        cache: /* @__PURE__ */ new Map(),
        options: ctx.options
      });
    }
    return ctx.instances.get(target);
  }
};
const initQueue = /* @__PURE__ */ new WeakMap();
function Cache(_options) {
  const baseOptions = {
    enabled: true,
    cacheKey: ObjectHashKeyFn,
    ttl: Infinity,
    enumerable: false,
    ...R.pickBy(_options ?? {}, R.isDefined)
  };
  return /* @__PURE__ */ __name(function handler(obj, key, descriptor) {
    if (Object.hasOwn(obj, "constructor")) {
      const constructor = obj.constructor;
      if (!initQueue.has(constructor)) {
        initQueue.set(constructor, []);
      }
      baseOptions.enumerable = Boolean(descriptor.get);
      initQueue.get(constructor).push({
        key,
        enumerable: _options?.enumerable ?? baseOptions.enumerable
      });
    }
    const target = state.extractDescriptor(descriptor);
    if (descriptor.get && !_options?.cacheKey) {
      baseOptions.cacheKey = SingletonCacheKeyFn;
    }
    const groupContext = {
      instances: /* @__PURE__ */ new WeakMap(),
      options: baseOptions
    };
    const fn = /* @__PURE__ */ __name(function wrapper(...args) {
      const invokeOriginal = /* @__PURE__ */ __name(() => target.value.apply(this, args), "invokeOriginal");
      const ctx = state.getInstanceContext(this, groupContext);
      if (!ctx.options.enabled) {
        return invokeOriginal();
      }
      const inputHash = ctx.options.cacheKey.apply(this, args);
      if (!ctx.cache.has(inputHash) || (ctx.cache.get(inputHash)?.expiresAt ?? Infinity) < Date.now()) {
        const result = invokeOriginal();
        ctx.cache.set(inputHash, {
          expiresAt: Date.now() + (ctx.options.ttl ?? Infinity),
          data: result
        });
      }
      return ctx.cache.get(inputHash).data;
    }, "wrapper");
    Object.defineProperty(fn, "name", {
      get: /* @__PURE__ */ __name(() => target.value.name ?? "anonymous", "get")
    });
    target.update(fn);
    state.container.set(fn, groupContext);
  }, "handler");
}
__name(Cache, "Cache");
Cache.init = /* @__PURE__ */ __name(function init(self) {
  const task = initQueue.get(self.constructor) ?? [];
  for (const { key, enumerable } of task) {
    const descriptor = Object.getOwnPropertyDescriptor(self.constructor.prototype, key);
    if (descriptor) {
      Object.defineProperty(self, key, Object.assign(descriptor, {
        enumerable
      }));
    }
  }
  initQueue.delete(self);
}, "init");
Cache.getInstance = /* @__PURE__ */ __name(function getInstance(target, property) {
  const descriptor = findDescriptor(target, property);
  if (!descriptor) {
    throw new TypeError(`No descriptor has been found for '${String(property)}'`);
  }
  const value = state.extractDescriptor(descriptor);
  const ctxByInstance = state.container.get(value.value);
  if (!ctxByInstance) {
    throw new TypeError(`No cache instance is bounded to '${String(property)}'!`);
  }
  const ctx = state.getInstanceContext(target, ctxByInstance);
  return {
    get(key = "") {
      return ctx.cache.get(key);
    },
    clear(keys) {
      if (keys) {
        keys.forEach((key) => ctx.cache.delete(key));
      } else {
        ctx.cache.clear();
      }
    },
    update(data) {
      const oldTTL = ctx.options.ttl;
      const newTTL = data.ttl;
      if (oldTTL !== newTTL && newTTL !== void 0) {
        for (const value2 of ctx.cache.values()) {
          if (value2.expiresAt === Infinity) {
            value2.expiresAt = Date.now() + newTTL;
          } else {
            const diff = newTTL - (oldTTL ?? 0);
            value2.expiresAt += diff;
          }
        }
      }
      Object.assign(ctx.options, data);
    },
    isEnabled() {
      return ctx.options.enabled;
    },
    enable() {
      ctx.options.enabled = true;
    },
    disable() {
      ctx.options.enabled = false;
    }
  };
}, "getInstance");
const WeakRefKeyFn = (() => {
  const _lookup = /* @__PURE__ */ new WeakMap();
  const fn = /* @__PURE__ */ __name((...args) => {
    const chunks = args.map((value) => {
      if (R.isObjectType(value) || R.isFunction(value)) {
        if (!_lookup.has(value)) {
          _lookup.set(value, createRandomHash(6));
        }
        return _lookup.get(value);
      }
      return value;
    });
    return createHash(JSON.stringify(chunks));
  }, "fn");
  fn.from = (cb) => {
    return function() {
      return cb(this).map(fn).join("#");
    };
  };
  return fn;
})();
const ObjectHashKeyFn = /* @__PURE__ */ __name((...args) => hash(args, {
  encoding: "base64",
  replacer: /* @__PURE__ */ (() => {
    const _lookup = /* @__PURE__ */ new WeakMap();
    return (value) => {
      if (value && value instanceof AbortSignal) {
        if (!_lookup.has(value)) {
          _lookup.set(value, createRandomHash(6));
        }
        return _lookup.get(value);
      }
      return value;
    };
  })(),
  unorderedArrays: false,
  unorderedObjects: false,
  unorderedSets: false
}), "ObjectHashKeyFn");
const JSONCacheKeyFn = /* @__PURE__ */ __name((...args) => JSON.stringify(args), "JSONCacheKeyFn");
const SingletonCacheKeyFn = /* @__PURE__ */ __name((...args) => "", "SingletonCacheKeyFn");
class CacheFn extends Function {
  static {
    __name(this, "CacheFn");
  }
  fn;
  options;
  name;
  static create(fn, options) {
    const instance = new CacheFn(fn, options);
    return instance;
  }
  constructor(fn, options) {
    super(), this.fn = fn, this.options = options, this.name = CacheFn.name;
    Cache.getInstance(this, "get").update(options ?? {});
    return new Proxy(this, {
      apply(target, _, args) {
        return target.get(...args);
      },
      get(target, prop, receiver) {
        const value = target[prop];
        if (value instanceof Function) {
          return function(...args) {
            return value.apply(this === receiver ? target : this, args);
          };
        }
        return value;
      }
    });
  }
  updateTTL(ttl) {
    Cache.getInstance(this, "get").update({
      ttl
    });
  }
  createSnapshot() {
    return {
      fn: this.fn,
      options: this.options
    };
  }
  get(...args) {
    return this.fn(...args);
  }
}
_ts_decorate([
  Cache(),
  _ts_metadata("design:type", Function),
  _ts_metadata("design:paramtypes", [
    typeof P === "undefined" ? Object : P
  ]),
  _ts_metadata("design:returntype", void 0)
], CacheFn.prototype, "get", null);

export { Cache, CacheFn, JSONCacheKeyFn, ObjectHashKeyFn, SingletonCacheKeyFn, WeakRefKeyFn };
//# sourceMappingURL=decoratorCache.js.map
//# sourceMappingURL=decoratorCache.js.map