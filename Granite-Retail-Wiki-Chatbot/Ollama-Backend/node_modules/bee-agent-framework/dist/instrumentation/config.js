import { parseEnv } from '../internals/env.js';
import { z } from 'zod';

const INSTRUMENTATION_ENABLED = parseEnv.asBoolean("BEE_FRAMEWORK_INSTRUMENTATION_ENABLED");
const INSTRUMENTATION_IGNORED_KEYS = parseEnv("BEE_FRAMEWORK_INSTRUMENTATION_IGNORED_KEYS", z.string(), "").split(",").filter(Boolean);

export { INSTRUMENTATION_ENABLED, INSTRUMENTATION_IGNORED_KEYS };
//# sourceMappingURL=config.js.map
//# sourceMappingURL=config.js.map