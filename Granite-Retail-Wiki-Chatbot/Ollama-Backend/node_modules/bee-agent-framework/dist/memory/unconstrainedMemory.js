import { BaseMemory } from './base.js';
import { shallowCopy } from '../serializer/utils.js';
import { removeFromArray } from '../internals/helpers/array.js';
import { ensureRange } from '../internals/helpers/number.js';

var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
class UnconstrainedMemory extends BaseMemory {
  static {
    __name(this, "UnconstrainedMemory");
  }
  messages = [];
  static {
    this.register();
  }
  async add(message, index) {
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
  loadSnapshot(snapshot) {
    Object.assign(this, snapshot);
  }
  createSnapshot() {
    return {
      messages: shallowCopy(this.messages)
    };
  }
}

export { UnconstrainedMemory };
//# sourceMappingURL=unconstrainedMemory.js.map
//# sourceMappingURL=unconstrainedMemory.js.map