import { BaseMemory, MemoryFatalError } from './base.js';
import { shallowCopy } from '../serializer/utils.js';
import { pipe, filter, isTruthy, forEach } from 'remeda';
import { castArray, removeFromArray } from '../internals/helpers/array.js';
import { ensureRange } from '../internals/helpers/number.js';

var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
class SlidingMemory extends BaseMemory {
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
      pipe(this.messages, handlers.removalSelector, castArray, filter(isTruthy), forEach((message2) => {
        const index2 = this.messages.indexOf(message2);
        if (index2 === -1) {
          throw new MemoryFatalError(`Cannot delete non existing message.`, [], {
            context: {
              message: message2,
              messages: this.messages
            }
          });
        }
        this.messages.splice(index2, 1);
      }));
      if (isOverflow()) {
        throw new MemoryFatalError(`Custom memory removalSelector did not return any message. Memory overflow has occurred.`);
      }
    }
    index = ensureRange(index ?? this.messages.length, {
      min: 0,
      max: this.messages.length
    });
    this.messages.splice(index, 0, message);
  }
  async delete(message) {
    return removeFromArray(this.messages, message);
  }
  reset() {
    this.messages.length = 0;
  }
  createSnapshot() {
    return {
      config: shallowCopy(this.config),
      messages: shallowCopy(this.messages)
    };
  }
  loadSnapshot(state) {
    Object.assign(this, state);
  }
}

export { SlidingMemory };
//# sourceMappingURL=slidingMemory.js.map
//# sourceMappingURL=slidingMemory.js.map