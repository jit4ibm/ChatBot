'use strict';

var env_cjs = require('../internals/env.cjs');
var zod = require('zod');

const INSTRUMENTATION_ENABLED = env_cjs.parseEnv.asBoolean("BEE_FRAMEWORK_INSTRUMENTATION_ENABLED");
const INSTRUMENTATION_IGNORED_KEYS = env_cjs.parseEnv("BEE_FRAMEWORK_INSTRUMENTATION_IGNORED_KEYS", zod.z.string(), "").split(",").filter(Boolean);

exports.INSTRUMENTATION_ENABLED = INSTRUMENTATION_ENABLED;
exports.INSTRUMENTATION_IGNORED_KEYS = INSTRUMENTATION_IGNORED_KEYS;
//# sourceMappingURL=config.cjs.map
//# sourceMappingURL=config.cjs.map