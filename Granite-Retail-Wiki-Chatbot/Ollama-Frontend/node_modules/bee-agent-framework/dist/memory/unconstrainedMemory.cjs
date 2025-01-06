'use strict';

var base_cjs = require('./base.cjs');
var utils_cjs = require('../serializer/utils.cjs');
var array_cjs = require('../internals/helpers/array.cjs');
var number_cjs = require('../internals/helpers/number.cjs');

var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
class UnconstrainedMemory extends base_cjs.BaseMemory {
  static {
    __name(this, "UnconstrainedMemory");
  }
  messages = [];
  static {
    this.register();
  }
  async add(message, index) {
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
  loadSnapshot(snapshot) {
    Object.assign(this, snapshot);
  }
  createSnapshot() {
    return {
      messages: utils_cjs.shallowCopy(this.messages)
    };
  }
}

exports.UnconstrainedMemory = UnconstrainedMemory;
//# sourceMappingURL=unconstrainedMemory.cjs.map
//# sourceMappingURL=unconstrainedMemory.cjs.map