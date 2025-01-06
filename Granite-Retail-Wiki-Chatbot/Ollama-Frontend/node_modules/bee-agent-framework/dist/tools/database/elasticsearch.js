import { Tool, ToolInputValidationError, ToolError, JSONToolOutput } from '../base.js';
import { Cache } from '../../cache/decoratorCache.js';
import { z } from 'zod';
import { ValidationError } from 'ajv';
import { parseBrokenJson } from '../../internals/helpers/schema.js';
import { Client } from '@elastic/elasticsearch';
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
const ElasticSearchAction = {
  ListIndices: "LIST_INDICES",
  GetIndexDetails: "GET_INDEX_DETAILS",
  Search: "SEARCH"
};
class ElasticSearchTool extends Tool {
  static {
    __name(this, "ElasticSearchTool");
  }
  name = "ElasticSearchTool";
  description = `Can query data from an ElasticSearch database. IMPORTANT: strictly follow this order of actions:
   1. ${ElasticSearchAction.ListIndices} - retrieve a list of available indices
   2. ${ElasticSearchAction.GetIndexDetails} - get details of index fields
   3. ${ElasticSearchAction.Search} - perform search or aggregation query on a specific index or pass the original user query without modifications if it's a valid JSON ElasticSearch query after identifying the index`;
  inputSchema() {
    return z.object({
      action: z.nativeEnum(ElasticSearchAction).describe(`The action to perform. ${ElasticSearchAction.ListIndices} lists all indices, ${ElasticSearchAction.GetIndexDetails} fetches details for a specified index, and ${ElasticSearchAction.Search} executes a search or aggregation query`),
      indexName: z.string().optional().describe(`The name of the index to query, required for ${ElasticSearchAction.GetIndexDetails} and ${ElasticSearchAction.Search}`),
      query: z.string().optional().describe(`Valid ElasticSearch JSON search or aggregation query for ${ElasticSearchAction.Search} action`),
      start: z.coerce.number().int().min(0).default(0).optional().describe("The record index from which the query will start. Increase by the size of the query to get the next page of results"),
      size: z.coerce.number().int().min(0).max(10).default(10).optional().describe("How many records will be retrieved from the ElasticSearch query. Maximum is 10")
    });
  }
  emitter = Emitter.root.child({
    namespace: [
      "tool",
      "database",
      "elasticsearch"
    ],
    creator: this
  });
  validateInput(schema, input) {
    super.validateInput(schema, input);
    if (input.action === ElasticSearchAction.GetIndexDetails && !input.indexName) {
      throw new ToolInputValidationError(`Index name is required for ${ElasticSearchAction.GetIndexDetails} action.`);
    }
    if (input.action === ElasticSearchAction.Search && (!input.indexName || !input.query)) {
      throw new ToolInputValidationError(`Both index name and query are required for ${ElasticSearchAction.Search} action.`);
    }
  }
  static {
    this.register();
  }
  constructor(options) {
    super(options);
    if (!options.connection.cloud && !options.connection.node && !options.connection.nodes) {
      throw new ValidationError([
        {
          message: "At least one of the properties must be provided",
          propertyName: "connection.cloud, connection.node, connection.nodes"
        }
      ]);
    }
  }
  async client() {
    try {
      const client = new Client(this.options.connection);
      await client.info();
      return client;
    } catch (error) {
      throw new ToolError(`Unable to connect to ElasticSearch.`, [
        error
      ], {
        isRetryable: false,
        isFatal: true
      });
    }
  }
  async _run(input, _options, run) {
    if (input.action === ElasticSearchAction.ListIndices) {
      const indices = await this.listIndices(run.signal);
      return new JSONToolOutput(indices);
    } else if (input.action === ElasticSearchAction.GetIndexDetails) {
      const indexDetails = await this.getIndexDetails(input, run.signal);
      return new JSONToolOutput(indexDetails);
    } else if (input.action === ElasticSearchAction.Search) {
      const response = await this.search(input, run.signal);
      if (response.aggregations) {
        return new JSONToolOutput(response.aggregations);
      } else {
        return new JSONToolOutput(response.hits.hits.map((hit) => hit._source));
      }
    } else {
      throw new ToolError(`Invalid action specified: ${input.action}`);
    }
  }
  async listIndices(signal) {
    const client = await this.client();
    const response = await client.cat.indices({
      expand_wildcards: "open",
      h: "index",
      format: "json"
    }, {
      signal
    });
    return response.filter((record) => record.index && !record.index.startsWith(".")).map((record) => ({
      index: record.index
    }));
  }
  async getIndexDetails(input, signal) {
    const client = await this.client();
    return await client.indices.getMapping({
      index: input.indexName
    }, {
      signal
    });
  }
  async search(input, signal) {
    const parsedQuery = parseBrokenJson(input.query);
    const searchBody = {
      ...parsedQuery,
      from: parsedQuery.from || input.start,
      size: parsedQuery.size || input.size
    };
    const client = await this.client();
    return await client.search({
      index: input.indexName,
      body: searchBody
    }, {
      signal
    });
  }
}
_ts_decorate([
  Cache(),
  _ts_metadata("design:type", Function),
  _ts_metadata("design:paramtypes", []),
  _ts_metadata("design:returntype", Promise)
], ElasticSearchTool.prototype, "client", null);

export { ElasticSearchAction, ElasticSearchTool };
//# sourceMappingURL=elasticsearch.js.map
//# sourceMappingURL=elasticsearch.js.map