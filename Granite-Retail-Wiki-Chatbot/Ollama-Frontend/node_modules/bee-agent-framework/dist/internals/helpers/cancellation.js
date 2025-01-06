var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
function createAbortController(...signals) {
  const controller = new AbortController();
  registerSignals(controller, signals);
  return controller;
}
__name(createAbortController, "createAbortController");
function registerSignals(controller, signals) {
  signals.forEach((signal) => {
    if (signal?.aborted) {
      controller.abort(signal.reason);
    }
    signal?.addEventListener?.("abort", () => {
      controller.abort(signal?.reason);
    }, {
      once: true,
      signal: controller.signal
    });
  });
}
__name(registerSignals, "registerSignals");

export { createAbortController, registerSignals };
//# sourceMappingURL=cancellation.js.map
//# sourceMappingURL=cancellation.js.map