'use strict';

var base_cjs = require('./base.cjs');
var utils_cjs = require('../serializer/utils.cjs');
var remeda = require('remeda');
var array_cjs = require('../internals/helpers/array.cjs');
var number_cjs = require('../internals/helpers/number.cjs');

var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
class SlidingMemory extends base_cjs.BaseMemory {
  static {
    __name(this, "SlidingMemory");
  }
  messages = [];
  config;
  constructor(config) {
    super();
    this.config = {
      ...config,
      handlers: {
        removalSelector: config.handlers?.removalSelector ?? ((messages) => [
          messages[0]
        ])
      }
    };
  }
  static {
    const aliases = [
      "SlidingWindowMemory"
    ];
    this.register(aliases);
  }
  async add(message, index) {
    const { size, handlers } = this.config;
    const isOverflow = /* @__PURE__ */ __name(() => this.messages.length + 1 > size, "isOverflow");
    if (isOverflow()) {
      remeda.pipe(this.messages, handlers.removalSelector, array_cjs.castArray, remeda.filter(remeda.isTruthy), remeda.forEach((message2) => {
        const index2 = this.messages.indexOf(message2);
        if (index2 === -1) {
          throw new base_cjs.MemoryFatalError(`Cannot delete non existing message.`, [], {
            context: {
              message: message2,
              messages: this.messages
            }
          });
        }
        this.messages.splice(index2, 1);
      }));
      if (isOverflow()) {
        throw new base_cjs.MemoryFatalError(`Custom memory removalSelector did not return any message. Memory overflow has occurred.`);
      }
    }
    index = number_cjs.ensureRange(index ?? this.messages.length, {
      min: 0,
      max: this.messages.length
    });
    this.messages.splice(index, 0, message);
  }
  async delete(message) {
    return array_cjs.removeFromArray(this.messages, message);
  }
  reset() {
    this.messages.length = 0;
  }
  createSnapshot() {
    return {
      config: utils_cjs.shallowCopy(this.config),
      messages: utils_cjs.shallowCopy(this.messages)
    };
  }
  loadSnapshot(state) {
    Object.assign(this, state);
  }
}

exports.SlidingMemory = SlidingMemory;
//# sourceMappingURL=slidingMemory.cjs.map
//# sourceMappingURL=slidingMemory.cjs.map