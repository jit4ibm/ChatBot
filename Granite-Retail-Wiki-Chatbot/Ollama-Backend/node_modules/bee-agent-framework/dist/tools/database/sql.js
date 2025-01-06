import { JSONToolOutput, Tool, ToolInputValidationError, ToolError } from '../base.js';
import { z } from 'zod';
import { Sequelize } from 'sequelize';
import { getMetadata } from './metadata.js';
import { Cache } from '../../cache/decoratorCache.js';
import { ValidationError } from 'ajv';
import { Emitter } from '../../emitter/emitter.js';

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
class SQLToolOutput extends JSONToolOutput {
  static {
    __name(this, "SQLToolOutput");
  }
}
class SQLTool extends Tool {
  static {
    __name(this, "SQLTool");
  }
  name = "SQLTool";
  description = `Converts natural language to SQL query and executes it. IMPORTANT: strictly follow this order of actions:
   1. ${SQLToolAction.GetMetadata} - get database tables structure (metadata)
   2. ${SQLToolAction.Query} - execute the generated SQL query`;
  inputSchema() {
    return z.object({
      action: z.nativeEnum(SQLToolAction).describe(`The action to perform. ${SQLToolAction.GetMetadata} get database tables structure, ${SQLToolAction.Query} execute the SQL query`),
      query: z.string().optional().describe(`The SQL query to be executed, required for ${SQLToolAction.Query} action`)
    });
  }
  emitter = Emitter.root.child({
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
      throw new ValidationError([
        {
          message: "Property is required",
          propertyName: "connection.dialect"
        }
      ]);
    }
    if (!options.connection.schema && (options.provider === "oracle" || options.provider === "db2")) {
      throw new ValidationError([
        {
          message: `Property is required for ${options.provider}`,
          propertyName: "connection.schema"
        }
      ]);
    }
    if (!options.connection.storage && options.provider === "sqlite") {
      throw new ValidationError([
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
      throw new ToolInputValidationError(`SQL Query is required for ${SQLToolAction.Query} action.`);
    }
  }
  static {
    this.register();
  }
  async connection() {
    try {
      const sequelize = new Sequelize(this.options.connection);
      await sequelize.authenticate();
      return sequelize;
    } catch (error) {
      throw new ToolError(`Unable to connect to database: ${error}`, [], {
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
      const metadata = await getMetadata(sequelize, provider, schema);
      return new SQLToolOutput(metadata);
    }
    if (input.action === SQLToolAction.Query) {
      return await this.executeQuery(input.query, provider, schema);
    }
    throw new ToolError(`Invalid action specified: ${input.action}`);
  }
  async executeQuery(query, provider, schema) {
    if (!this.isReadOnlyQuery(query)) {
      return new JSONToolOutput({
        success: false,
        error: "Invalid query. Only SELECT queries are allowed."
      });
    }
    try {
      const sequelize = await this.connection();
      const [results] = await sequelize.query(query);
      if (Array.isArray(results) && results.length > 0) {
        return new JSONToolOutput({
          success: true,
          results
        });
      }
      return new JSONToolOutput({
        success: false,
        message: `No rows selected`
      });
    } catch (error) {
      const schemaHint = schema ? `Fully qualify the table names by appending the schema name "${schema}" as a prefix, for example: ${schema}.table_name` : "";
      const errorMessage = `Generate a correct query that retrieves data using the appropriate ${provider} dialect.
      ${schemaHint}
      The original request was: ${query}, and the error was: ${error.message}.`;
      throw new ToolError(errorMessage);
    }
  }
  isReadOnlyQuery(query) {
    const normalizedQuery = query.trim().toUpperCase();
    return normalizedQuery.startsWith("SELECT") || normalizedQuery.startsWith("SHOW") || normalizedQuery.startsWith("DESC");
  }
  async destroy() {
    const cache = Cache.getInstance(this, "connection");
    const entry = cache.get();
    if (entry) {
      cache.clear();
      try {
        await entry.data.close();
      } catch (error) {
        throw new ToolError(`Failed to close the database connection`, [
          error
        ]);
      }
    }
  }
}
_ts_decorate([
  Cache(),
  _ts_metadata("design:type", Function),
  _ts_metadata("design:paramtypes", []),
  _ts_metadata("design:returntype", Promise)
], SQLTool.prototype, "connection", null);

export { SQLTool, SQLToolAction, SQLToolOutput };
//# sourceMappingURL=sql.js.map
//# sourceMappingURL=sql.js.map