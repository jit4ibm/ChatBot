import * as R from 'remeda';
import { TaskState, Task } from 'promise-based-task';
import { FrameworkError } from '../../errors.js';
import { asyncProperties } from './promise.js';
import { createRandomHash } from './hash.js';
import { pRetry } from './retry.js';

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
    this.#id = createRandomHash();
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
    await Promise.all(R.values(inputs).map((input) => input.get()));
    return await asyncProperties(R.mapValues(inputs, (value) => value.get()));
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
    return this.#value?.state === TaskState.RESOLVED;
  }
  get isRejected() {
    return this.#value?.state === TaskState.REJECTED;
  }
  _run(config) {
    const task = new Task();
    const assertAborted = /* @__PURE__ */ __name(() => {
      this.#config.signal?.throwIfAborted?.();
      config?.groupSignal?.throwIfAborted?.();
    }, "assertAborted");
    let lastError = null;
    pRetry(async (attempt) => {
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
        if (!FrameworkError.isRetryable(e)) {
          return false;
        }
        return !config?.groupSignal?.aborted && !this.#config.signal?.aborted;
      }, "shouldRetry"),
      onFailedAttempt: /* @__PURE__ */ __name(async (e, meta) => {
        lastError = e;
        await this.#handlers.onError?.(e, this.#getContext(meta.attempt));
        if (!FrameworkError.isRetryable(e)) {
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
    if (this.#value?.state === TaskState.PENDING && !config) {
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

export { Retryable, RunStrategy };
//# sourceMappingURL=retryable.js.map
//# sourceMappingURL=retryable.js.map