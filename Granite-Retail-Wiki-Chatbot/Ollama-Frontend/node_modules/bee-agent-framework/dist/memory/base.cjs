'use strict';

var errors_cjs = require('../errors.cjs');
var serializable_cjs = require('../internals/serializable.cjs');

var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
class MemoryError extends errors_cjs.FrameworkError {
  static {
    __name(this, "MemoryError");
  }
}
class MemoryFatalError extends MemoryError {
  static {
    __name(this, "MemoryFatalError");
  }
  constructor(message, errors, options) {
    super(message, errors, {
      isFatal: true,
      isRetryable: false,
      ...options
    });
  }
}
class BaseMemory extends serializable_cjs.Serializable {
  static {
    __name(this, "BaseMemory");
  }
  async addMany(messages, start) {
    let counter = 0;
    for await (const msg of messages) {
      await this.add(msg, start === void 0 ? void 0 : start + counter);
      counter += 1;
    }
  }
  async deleteMany(messages) {
    for await (const msg of messages) {
      await this.delete(msg);
    }
  }
  async splice(start, deleteCount, ...items) {
    const total = this.messages.length;
    start = start < 0 ? Math.max(total + start, 0) : start;
    deleteCount = Math.min(deleteCount, total - start);
    const deletedItems = this.messages.slice(start, start + deleteCount);
    await this.deleteMany(deletedItems);
    await this.addMany(items, start);
    return deletedItems;
  }
  isEmpty() {
    return this.messages.length === 0;
  }
  asReadOnly() {
    return new ReadOnlyMemory(this);
  }
  [Symbol.iterator]() {
    return this.messages[Symbol.iterator]();
  }
}
class ReadOnlyMemory extends BaseMemory {
  static {
    __name(this, "ReadOnlyMemory");
  }
  source;
  constructor(source) {
    super(), this.source = source;
  }
  static {
    this.register();
  }
  // eslint-disable-next-line unused-imports/no-unused-vars
  async add(message, index) {
  }
  // eslint-disable-next-line unused-imports/no-unused-vars
  async delete(message) {
    return false;
  }
  get messages() {
    return this.source.messages;
  }
  reset() {
  }
  createSnapshot() {
    return {
      source: this.source
    };
  }
  loadSnapshot(state) {
    Object.assign(this, state);
  }
}

exports.BaseMemory = BaseMemory;
exports.MemoryError = MemoryError;
exports.MemoryFatalError = MemoryFatalError;
exports.ReadOnlyMemory = ReadOnlyMemory;
//# sourceMappingURL=base.cjs.map
//# sourceMappingURL=base.cjs.map