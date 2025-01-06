'use strict';

var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
class IdNameManager {
  static {
    __name(this, "IdNameManager");
  }
  /** Current index for each event */
  #idNamesCounter = /* @__PURE__ */ new Map();
  /** The new span id names and the original framework emitter event ids dictionary */
  #idNameMap = /* @__PURE__ */ new Map();
  /** We need to map the run tree structure with duplicities to the event tree structure */
  #runIdMap = /* @__PURE__ */ new Map();
  #spanIdGenerator(name) {
    const count = this.#idNamesCounter.get(name) || 0;
    this.#idNamesCounter.set(name, count + 1);
    return `${name}-${this.#idNamesCounter.get(name)}`;
  }
  getIds({ path, id, runId, parentRunId, groupId }) {
    this.#runIdMap.set(runId, id);
    const spanId = this.#spanIdGenerator(path);
    this.#idNameMap.set(id, spanId);
    const parentSpanId = parentRunId ? this.#idNameMap.get(this.#runIdMap.get(parentRunId) || "") : groupId;
    return {
      spanId,
      parentSpanId
    };
  }
}

exports.IdNameManager = IdNameManager;
//# sourceMappingURL=id-name-manager.cjs.map
//# sourceMappingURL=id-name-manager.cjs.map