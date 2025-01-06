import { Tool, StringToolOutput } from './base.js';
import { z } from 'zod';
import { create, all } from 'mathjs';
import { Emitter } from '../emitter/emitter.js';

var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
class CalculatorTool extends Tool {
  static {
    __name(this, "CalculatorTool");
  }
  name = "Calculator";
  description = `A calculator tool that performs basic arithmetic operations like addition, subtraction, multiplication, and division. 
Only use the calculator tool if you need to perform a calculation.`;
  emitter = Emitter.root.child({
    namespace: [
      "tool",
      "calculator"
    ],
    creator: this
  });
  inputSchema() {
    return z.object({
      expression: z.string().min(1).describe(`The mathematical expression to evaluate (e.g., "2 + 3 * 4"). Use Mathjs basic expression syntax. Constants only.`)
    });
  }
  limitedEvaluate;
  constructor({ config, imports, ...options } = {}) {
    super(options);
    const math = create(all, config);
    this.limitedEvaluate = math.evaluate;
    math.import({
      // most important (hardly any functional impact)
      import: /* @__PURE__ */ __name(function() {
        throw new Error("Function import is disabled");
      }, "import"),
      createUnit: /* @__PURE__ */ __name(function() {
        throw new Error("Function createUnit is disabled");
      }, "createUnit"),
      reviver: /* @__PURE__ */ __name(function() {
        throw new Error("Function reviver is disabled");
      }, "reviver"),
      // extra (has functional impact)
      evaluate: /* @__PURE__ */ __name(function() {
        throw new Error("Function evaluate is disabled");
      }, "evaluate"),
      parse: /* @__PURE__ */ __name(function() {
        throw new Error("Function parse is disabled");
      }, "parse"),
      simplify: /* @__PURE__ */ __name(function() {
        throw new Error("Function simplify is disabled");
      }, "simplify"),
      derivative: /* @__PURE__ */ __name(function() {
        throw new Error("Function derivative is disabled");
      }, "derivative"),
      resolve: /* @__PURE__ */ __name(function() {
        throw new Error("Function resolve is disabled");
      }, "resolve")
    }, {
      override: true,
      ...imports?.options
    });
  }
  async _run({ expression }) {
    const result = this.limitedEvaluate(expression);
    return new StringToolOutput(result);
  }
}

export { CalculatorTool };
//# sourceMappingURL=calculator.js.map
//# sourceMappingURL=calculator.js.map