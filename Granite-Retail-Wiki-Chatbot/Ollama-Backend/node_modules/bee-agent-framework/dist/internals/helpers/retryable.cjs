'use strict';

var R = require('remeda');
var promiseBasedTask = require('promise-based-task');
var errors_cjs = require('../../errors.cjs');
var promise_cjs = require('./promise.cjs');
var hash_cjs = require('./hash.cjs');
var retry_cjs = require('./retry.cjs');

function _interopNamespace(e) {
  if (e && e.__esModule) return e;
  var n = Object.create(null);
  if (e) {
    Object.keys(e).forEach(function (k) {
      if (k !== 'default') {
        var d = Object.getOwnPropertyDescriptor(e, k);
        Object.defineProperty(n, k, d.get ? d : {
          enumerable: true,
          get: function () { return e[k]; }
        });
      }
    });
  }
  n.default = e;
  return Object.freeze(n);
}

var R__namespace = /*#__PURE__*/_interopNamespace(R);

var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
const RunStrategy = {
  /**
  * Once a single Retryable throws, other retry ables get cancelled immediately.
  */
  THROW_IMMEDIATELY: "THROW_IMMEDIATELY",
  /**
  * Once a single Retryable throws, wait for other to completes, but prevent further retries.
  */
  SETTLE_ROUND: "SETTLE_ROUND",
  /**
  * Once a single Retryable throws, other Retryables remains to continue. Error is thrown by the end.
  */
  SETTLE_ALL: "SETTLE_ALL"
};
class Retryable {
  static {
    __name(this, "Retryable");
  }
  #id;
  #value;
  #config;
  #handlers;
  constructor(ctx) {
    this.#value = null;
    this.#id = hash_cjs.createRandomHash();
    this.#handlers = {
      executor: ctx.executor,
      onReset: ctx.onReset,
      onError: ctx.onError,
      onRetry: ctx.onRetry
    };
    this.#config = {
      ...ctx.config,
      maxRetries: Math.max(ctx.config?.maxRetries || 0, 0)
    };
  }
  static async runGroup(strategy, inputs) {
    if (strategy === RunStrategy.THROW_IMMEDIATELY) {
      return await Promise.all(inputs.map((input) => input.get()));
    }
    const controller = new AbortController();
    const results = await Promise.allSettled(inputs.map((input) => input.get(strategy === RunStrategy.SETTLE_ALL ? {
      groupSignal: controller.signal
    } : void 0).catch((err) => {
      controller.abort(err);
      throw err;
    })));
    controller.signal.throwIfAborted();
    return results.map((result) => result.value);
  }
  static async *runSequence(inputs) {
    for (const input of inputs) {
      yield await input.get();
    }
  }
  static async collect(inputs) {
    await Promise.all(R__namespace.values(inputs).map((input) => input.get()));
    return await promise_cjs.asyncProperties(R__namespace.mapValues(inputs, (value) => value.get()));
  }
  #getContext(attempt) {
    const ctx = {
      attempt,
      executionId: this.#id,
      signal: this.#config.signal
    };
    Object.defineProperty(ctx, "signal", {
      enumerable: false
    });
    return ctx;
  }
  get isResolved() {
    return this.#value?.state === promiseBasedTask.TaskState.RESOLVED;
  }
  get isRejected() {
    return this.#value?.state === promiseBasedTask.TaskState.REJECTED;
  }
  _run(config) {
    const task = new promiseBasedTask.Task();
    const assertAborted = /* @__PURE__ */ __name(() => {
      this.#config.signal?.throwIfAborted?.();
      config?.groupSignal?.throwIfAborted?.();
    }, "assertAborted");
    let lastError = null;
    retry_cjs.pRetry(async (attempt) => {
      assertAborted();
      const ctx = this.#getContext(attempt);
      if (attempt > 1) {
        await this.#handlers.onRetry?.(ctx, lastError);
      }
      return await this.#handlers.executor(ctx);
    }, {
      retries: this.#config.maxRetries,
      factor: this.#config.factor,
      signal: this.#config.signal,
      shouldRetry: /* @__PURE__ */ __name((e) => {
        if (!errors_cjs.FrameworkError.isRetryable(e)) {
          return false;
        }
        return !config?.groupSignal?.aborted && !this.#config.signal?.aborted;
      }, "shouldRetry"),
      onFailedAttempt: /* @__PURE__ */ __name(async (e, meta) => {
        lastError = e;
        await this.#handlers.onError?.(e, this.#getContext(meta.attempt));
        if (!errors_cjs.FrameworkError.isRetryable(e)) {
          throw e;
        }
        assertAborted();
      }, "onFailedAttempt")
    }).then((x) => task.resolve(x)).catch((x) => task.reject(x));
    return task;
  }
  async get(config) {
    if (this.isResolved) {
      return this.#value.resolvedValue();
    }
    if (this.isRejected) {
      throw this.#value?.rejectedValue();
    }
    if (this.#value?.state === promiseBasedTask.TaskState.PENDING && !config) {
      return this.#value;
    }
    this.#value?.catch?.(() => {
    });
    this.#value = this._run(config);
    return this.#value;
  }
  reset() {
    this.#value?.catch?.(() => {
    });
    this.#value = null;
    this.#handlers.onReset?.();
  }
}

exports.Retryable = Retryable;
exports.RunStrategy = RunStrategy;
//# sourceMappingURL=retryable.cjs.map
//# sourceMappingURL=retryable.cjs.map