'use strict';

var base_cjs = require('../base.cjs');
var zod = require('zod');
var sequelize = require('sequelize');
var metadata_cjs = require('./metadata.cjs');
var decoratorCache_cjs = require('../../cache/decoratorCache.cjs');
var ajv = require('ajv');
var emitter_cjs = require('../../emitter/emitter.cjs');

var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
function _ts_decorate(decorators, target, key, desc) {
  var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
  if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
  else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
  return c > 3 && r && Object.defineProperty(target, key, r), r;
}
__name(_ts_decorate, "_ts_decorate");
function _ts_metadata(k, v) {
  if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
}
__name(_ts_metadata, "_ts_metadata");
const SQLToolAction = {
  GetMetadata: "GET_METADATA",
  Query: "QUERY"
};
class SQLToolOutput extends base_cjs.JSONToolOutput {
  static {
    __name(this, "SQLToolOutput");
  }
}
class SQLTool extends base_cjs.Tool {
  static {
    __name(this, "SQLTool");
  }
  name = "SQLTool";
  description = `Converts natural language to SQL query and executes it. IMPORTANT: strictly follow this order of actions:
   1. ${SQLToolAction.GetMetadata} - get database tables structure (metadata)
   2. ${SQLToolAction.Query} - execute the generated SQL query`;
  inputSchema() {
    return zod.z.object({
      action: zod.z.nativeEnum(SQLToolAction).describe(`The action to perform. ${SQLToolAction.GetMetadata} get database tables structure, ${SQLToolAction.Query} execute the SQL query`),
      query: zod.z.string().optional().describe(`The SQL query to be executed, required for ${SQLToolAction.Query} action`)
    });
  }
  emitter = emitter_cjs.Emitter.root.child({
    namespace: [
      "tool",
      "database",
      "sql"
    ],
    creator: this
  });
  constructor(options) {
    super(options);
    if (!options.connection.dialect) {
      throw new ajv.ValidationError([
        {
          message: "Property is required",
          propertyName: "connection.dialect"
        }
      ]);
    }
    if (!options.connection.schema && (options.provider === "oracle" || options.provider === "db2")) {
      throw new ajv.ValidationError([
        {
          message: `Property is required for ${options.provider}`,
          propertyName: "connection.schema"
        }
      ]);
    }
    if (!options.connection.storage && options.provider === "sqlite") {
      throw new ajv.ValidationError([
        {
          message: `Property is required for ${options.provider}`,
          propertyName: "connection.storage"
        }
      ]);
    }
  }
  validateInput(schema, input) {
    super.validateInput(schema, input);
    if (input.action === SQLToolAction.Query && !input.query) {
      throw new base_cjs.ToolInputValidationError(`SQL Query is required for ${SQLToolAction.Query} action.`);
    }
  }
  static {
    this.register();
  }
  async connection() {
    try {
      const sequelize$1 = new sequelize.Sequelize(this.options.connection);
      await sequelize$1.authenticate();
      return sequelize$1;
    } catch (error) {
      throw new base_cjs.ToolError(`Unable to connect to database: ${error}`, [], {
        isRetryable: false,
        isFatal: true
      });
    }
  }
  async _run(input, _options) {
    const { provider, connection } = this.options;
    const { schema } = connection;
    if (input.action === SQLToolAction.GetMetadata) {
      const sequelize = await this.connection();
      const metadata = await metadata_cjs.getMetadata(sequelize, provider, schema);
      return new SQLToolOutput(metadata);
    }
    if (input.action === SQLToolAction.Query) {
      return await this.executeQuery(input.query, provider, schema);
    }
    throw new base_cjs.ToolError(`Invalid action specified: ${input.action}`);
  }
  async executeQuery(query, provider, schema) {
    if (!this.isReadOnlyQuery(query)) {
      return new base_cjs.JSONToolOutput({
        success: false,
        error: "Invalid query. Only SELECT queries are allowed."
      });
    }
    try {
      const sequelize = await this.connection();
      const [results] = await sequelize.query(query);
      if (Array.isArray(results) && results.length > 0) {
        return new base_cjs.JSONToolOutput({
          success: true,
          results
        });
      }
      return new base_cjs.JSONToolOutput({
        success: false,
        message: `No rows selected`
      });
    } catch (error) {
      const schemaHint = schema ? `Fully qualify the table names by appending the schema name "${schema}" as a prefix, for example: ${schema}.table_name` : "";
      const errorMessage = `Generate a correct query that retrieves data using the appropriate ${provider} dialect.
      ${schemaHint}
      The original request was: ${query}, and the error was: ${error.message}.`;
      throw new base_cjs.ToolError(errorMessage);
    }
  }
  isReadOnlyQuery(query) {
    const normalizedQuery = query.trim().toUpperCase();
    return normalizedQuery.startsWith("SELECT") || normalizedQuery.startsWith("SHOW") || normalizedQuery.startsWith("DESC");
  }
  async destroy() {
    const cache = decoratorCache_cjs.Cache.getInstance(this, "connection");
    const entry = cache.get();
    if (entry) {
      cache.clear();
      try {
        await entry.data.close();
      } catch (error) {
        throw new base_cjs.ToolError(`Failed to close the database connection`, [
          error
        ]);
      }
    }
  }
}
_ts_decorate([
  decoratorCache_cjs.Cache(),
  _ts_metadata("design:type", Function),
  _ts_metadata("design:paramtypes", []),
  _ts_metadata("design:returntype", Promise)
], SQLTool.prototype, "connection", null);

exports.SQLTool = SQLTool;
exports.SQLToolAction = SQLToolAction;
exports.SQLToolOutput = SQLToolOutput;
//# sourceMappingURL=sql.cjs.map
//# sourceMappingURL=sql.cjs.map