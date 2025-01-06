'use strict';

var serializable_cjs = require('../../internals/serializable.cjs');
var logger_cjs = require('../logger.cjs');
var object_cjs = require('../../internals/helpers/object.cjs');

var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
function getSerializedObjectSafe(dataObject) {
  const data = object_cjs.getProp(dataObject, [
    "data"
  ], dataObject);
  if (data instanceof serializable_cjs.Serializable) {
    try {
      return data.createSnapshot();
    } catch (e) {
      logger_cjs.instrumentationLogger.warn(e, "Invalid createSnapshot method in the Serializable class");
      return null;
    }
  }
  return data;
}
__name(getSerializedObjectSafe, "getSerializedObjectSafe");

exports.getSerializedObjectSafe = getSerializedObjectSafe;
//# sourceMappingURL=get-serialized-object-safe.cjs.map
//# sourceMappingURL=get-serialized-object-safe.cjs.map