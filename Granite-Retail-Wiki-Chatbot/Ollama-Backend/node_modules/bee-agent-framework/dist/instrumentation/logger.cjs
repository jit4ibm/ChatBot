'use strict';

var logger_cjs = require('../logger/logger.cjs');

const instrumentationLogger = logger_cjs.Logger.root.child({
  name: "instrumentation",
  level: logger_cjs.LoggerLevel.WARN
});

exports.instrumentationLogger = instrumentationLogger;
//# sourceMappingURL=logger.cjs.map
//# sourceMappingURL=logger.cjs.map