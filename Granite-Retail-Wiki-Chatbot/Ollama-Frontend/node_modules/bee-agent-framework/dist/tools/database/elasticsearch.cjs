'use strict';

var base_cjs = require('../base.cjs');
var decoratorCache_cjs = require('../../cache/decoratorCache.cjs');
var zod = require('zod');
var ajv = require('ajv');
var schema_cjs = require('../../internals/helpers/schema.cjs');
var elasticsearch = require('@elastic/elasticsearch');
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
const ElasticSearchAction = {
  ListIndices: "LIST_INDICES",
  GetIndexDetails: "GET_INDEX_DETAILS",
  Search: "SEARCH"
};
class ElasticSearchTool extends base_cjs.Tool {
  static {
    __name(this, "ElasticSearchTool");
  }
  name = "ElasticSearchTool";
  description = `Can query data from an ElasticSearch database. IMPORTANT: strictly follow this order of actions:
   1. ${ElasticSearchAction.ListIndices} - retrieve a list of available indices
   2. ${ElasticSearchAction.GetIndexDetails} - get details of index fields
   3. ${ElasticSearchAction.Search} - perform search or aggregation query on a specific index or pass the original user query without modifications if it's a valid JSON ElasticSearch query after identifying the index`;
  inputSchema() {
    return zod.z.object({
      action: zod.z.nativeEnum(ElasticSearchAction).describe(`The action to perform. ${ElasticSearchAction.ListIndices} lists all indices, ${ElasticSearchAction.GetIndexDetails} fetches details for a specified index, and ${ElasticSearchAction.Search} executes a search or aggregation query`),
      indexName: zod.z.string().optional().describe(`The name of the index to query, required for ${ElasticSearchAction.GetIndexDetails} and ${ElasticSearchAction.Search}`),
      query: zod.z.string().optional().describe(`Valid ElasticSearch JSON search or aggregation query for ${ElasticSearchAction.Search} action`),
      start: zod.z.coerce.number().int().min(0).default(0).optional().describe("The record index from which the query will start. Increase by the size of the query to get the next page of results"),
      size: zod.z.coerce.number().int().min(0).max(10).default(10).optional().describe("How many records will be retrieved from the ElasticSearch query. Maximum is 10")
    });
  }
  emitter = emitter_cjs.Emitter.root.child({
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
      throw new base_cjs.ToolInputValidationError(`Index name is required for ${ElasticSearchAction.GetIndexDetails} action.`);
    }
    if (input.action === ElasticSearchAction.Search && (!input.indexName || !input.query)) {
      throw new base_cjs.ToolInputValidationError(`Both index name and query are required for ${ElasticSearchAction.Search} action.`);
    }
  }
  static {
    this.register();
  }
  constructor(options) {
    super(options);
    if (!options.connection.cloud && !options.connection.node && !options.connection.nodes) {
      throw new ajv.ValidationError([
        {
          message: "At least one of the properties must be provided",
          propertyName: "connection.cloud, connection.node, connection.nodes"
        }
      ]);
    }
  }
  async client() {
    try {
      const client = new elasticsearch.Client(this.options.connection);
      await client.info();
      return client;
    } catch (error) {
      throw new base_cjs.ToolError(`Unable to connect to ElasticSearch.`, [
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
      return new base_cjs.JSONToolOutput(indices);
    } else if (input.action === ElasticSearchAction.GetIndexDetails) {
      const indexDetails = await this.getIndexDetails(input, run.signal);
      return new base_cjs.JSONToolOutput(indexDetails);
    } else if (input.action === ElasticSearchAction.Search) {
      const response = await this.search(input, run.signal);
      if (response.aggregations) {
        return new base_cjs.JSONToolOutput(response.aggregations);
      } else {
        return new base_cjs.JSONToolOutput(response.hits.hits.map((hit) => hit._source));
      }
    } else {
      throw new base_cjs.ToolError(`Invalid action specified: ${input.action}`);
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
    const parsedQuery = schema_cjs.parseBrokenJson(input.query);
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
  decoratorCache_cjs.Cache(),
  _ts_metadata("design:type", Function),
  _ts_metadata("design:paramtypes", []),
  _ts_metadata("design:returntype", Promise)
], ElasticSearchTool.prototype, "client", null);

exports.ElasticSearchAction = ElasticSearchAction;
exports.ElasticSearchTool = ElasticSearchTool;
//# sourceMappingURL=elasticsearch.cjs.map
//# sourceMappingURL=elasticsearch.cjs.map