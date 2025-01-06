import { Serializable } from '../../internals/serializable.js';
import { instrumentationLogger } from '../logger.js';
import { getProp } from '../../internals/helpers/object.js';

var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
function getSerializedObjectSafe(dataObject) {
  const data = getProp(dataObject, [
    "data"
  ], dataObject);
  if (data instanceof Serializable) {
    try {
      return data.createSnapshot();
    } catch (e) {
      instrumentationLogger.warn(e, "Invalid createSnapshot method in the Serializable class");
      return null;
    }
  }
  return data;
}
__name(getSerializedObjectSafe, "getSerializedObjectSafe");

export { getSerializedObjectSafe };
//# sourceMappingURL=get-serialized-object-safe.js.map
//# sourceMappingURL=get-serialized-object-safe.js.map