'use strict';

var promises = require('node:timers/promises');

var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
async function* sleep(ms, signal) {
  const start = Date.now();
  const ctx = {
    iteration: 0,
    elapsed: 0
  };
  while (true) {
    await promises.setTimeout(ms, {
      signal
    });
    ctx.elapsed = Date.now() - start;
    ctx.iteration++;
    yield ctx;
  }
}
__name(sleep, "sleep");
function validate(value, schema) {
  schema.parse(value);
}
__name(validate, "validate");

exports.sleep = sleep;
exports.validate = validate;
//# sourceMappingURL=general.cjs.map
//# sourceMappingURL=general.cjs.map