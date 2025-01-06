import { setTimeout } from 'node:timers/promises';
import { signalRace } from './promise.js';
import { FrameworkError } from '../../errors.js';

var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
async function pRetry(fn, options) {
  const handler = /* @__PURE__ */ __name(async (attempt, remaining) => {
    try {
      const factor = options?.factor ?? 2;
      if (attempt > 1) {
        const ms = Math.round(Math.pow(factor, attempt - 1)) * 1e3;
        await setTimeout(ms, void 0, {
          signal: options?.signal
        });
      }
      return await fn(attempt);
    } catch (e) {
      const meta = {
        attempt,
        remaining
      };
      if (FrameworkError.isAbortError(e)) {
        throw e.cause || e;
      }
      await options?.onFailedAttempt?.(e, meta);
      if (remaining <= 0) {
        throw e;
      }
      if (await options?.shouldRetry?.(e, meta) === false) {
        throw e;
      }
      return await handler(attempt + 1, remaining - 1);
    }
  }, "handler");
  return await signalRace(() => handler(1, options?.retries ?? 0), options?.signal);
}
__name(pRetry, "pRetry");

export { pRetry };
//# sourceMappingURL=retry.js.map
//# sourceMappingURL=retry.js.map