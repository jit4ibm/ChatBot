'use strict';

var base_cjs = require('../base.cjs');
var decoratorCache_cjs = require('../../cache/decoratorCache.cjs');
var milvus2SdkNode = require('@zilliz/milvus2-sdk-node');
var zod = require('zod');
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
var MilvusAction = /* @__PURE__ */ function(MilvusAction2) {
  MilvusAction2["ListCollections"] = "ListCollections";
  MilvusAction2["GetCollectionInfo"] = "GetCollectionInfo";
  MilvusAction2["Search"] = "Search";
  MilvusAction2["Insert"] = "Insert";
  MilvusAction2["Delete"] = "Delete";
  return MilvusAction2;
}({});
class MilvusDatabaseTool extends base_cjs.Tool {
  static {
    __name(this, "MilvusDatabaseTool");
  }
  name = "MilvusDatabaseTool";
  description = `Can query data from a Milvus database. IMPORTANT: strictly follow this order of actions:
   1. ${"ListCollections"} - List all the Milvus collections
   2. ${"GetCollectionInfo"} - Get information about into a Milvus collection
   3. ${"Insert"} - Insert data into a Milvus collection
   3. ${"Search"} - Perform search on a Milvus collection
   4. ${"Delete"} - Delete from a Milvus collection`;
  inputSchema() {
    return zod.z.object({
      action: zod.z.nativeEnum(MilvusAction).describe(`The action to perform. ${"ListCollections"} lists all collections, ${"GetCollectionInfo"} fetches details for a specified collection, ${"Search"} executes a vector search, ${"Insert"} inserts new vectors, and ${"Delete"} removes vectors.`),
      collectionName: zod.z.string().optional().describe(`The name of the collection to query, required for ${"GetCollectionInfo"}, ${"Search"}, ${"Insert"}, and ${"Delete"}`),
      vector: zod.z.array(zod.z.number()).optional().describe(`The vector to search for or insert, required for ${"Search"}`),
      vectors: zod.z.array(zod.z.array(zod.z.number())).optional().describe(`The vectors to insert, required for ${"Insert"}`),
      topK: zod.z.coerce.number().int().min(1).max(1e3).default(10).optional().describe(`The number of nearest neighbors to return for ${"Search"}. Maximum is 1000`),
      filter: zod.z.string().optional().describe(`Optional filter expression for ${"Search"}`),
      metadata: zod.z.record(zod.z.string(), zod.z.any()).optional().describe(`Additional metadata to insert with vectors for ${"Insert"}`),
      ids: zod.z.array(zod.z.string().or(zod.z.number())).optional().describe(`Array of IDs to delete for ${"Delete"}`),
      searchOutput: zod.z.array(zod.z.string()).optional().describe(`Fields to return in search results for ${"Search"}`)
    });
  }
  emitter = emitter_cjs.Emitter.root.child({
    namespace: [
      "tool",
      "database",
      "milvus"
    ],
    creator: this
  });
  validateInput(schema, input) {
    super.validateInput(schema, input);
    if (input.action === "GetCollectionInfo" && !input.collectionName) {
      throw new base_cjs.ToolInputValidationError(`Collection name is required for ${"GetCollectionInfo"}, ${"Search"}, ${"Insert"}, and ${"Delete"} actions.`);
    }
    if (input.action === "Search" && (!input.collectionName || !input.vector)) {
      throw new base_cjs.ToolInputValidationError(`Both collection name and vector are required for ${"Search"} action.`);
    }
    if (input.action === "Insert" && (!input.collectionName || !input.vectors)) {
      throw new base_cjs.ToolInputValidationError(`Both collection name and vectors are required for ${"Insert"} action.`);
    }
  }
  static {
    this.register();
  }
  async client() {
    try {
      const client = new milvus2SdkNode.MilvusClient(this.options.connection);
      await client.listCollections();
      return client;
    } catch (error) {
      throw new base_cjs.ToolError(`Unable to connect to Milvus.`, [
        error
      ], {
        isRetryable: false,
        isFatal: true
      });
    }
  }
  async _run(input, _options) {
    switch (input.action) {
      case "ListCollections": {
        const collections = await this.listCollections();
        return new base_cjs.JSONToolOutput(collections);
      }
      case "GetCollectionInfo": {
        if (!input.collectionName) {
          throw new base_cjs.ToolError("A collection name is required for Milvus GetCollectionInfo action");
        }
        const collectionInfo = await this.getCollectionInfo(input.collectionName);
        return new base_cjs.JSONToolOutput(collectionInfo);
      }
      case "Search": {
        if (!input.collectionName || !input.vector) {
          throw new base_cjs.ToolError("A collection name and vector are required for Milvus Search action");
        }
        const searchResults = await this.search(input);
        return new base_cjs.JSONToolOutput(searchResults);
      }
      case "Insert": {
        if (!input.collectionName || !input.vectors) {
          throw new base_cjs.ToolError("A collection name and vectors are required for Milvus Insert action");
        }
        const insertResults = await this.insert(input);
        return new base_cjs.JSONToolOutput(insertResults);
      }
      case "Delete": {
        if (!input.collectionName || !input.ids) {
          throw new base_cjs.ToolError("Collection name and ids are required for Milvus Delete action");
        }
        const deleteResults = await this.delete(input);
        return new base_cjs.JSONToolOutput(deleteResults);
      }
      default: {
        throw new base_cjs.ToolError(`Invalid action specified: ${input.action}`);
      }
    }
  }
  async listCollections() {
    try {
      const client = await this.client();
      const response = await client.listCollections({});
      if (response && response.data && Array.isArray(response.data)) {
        return response.data.map((collection) => collection.name);
      } else {
        return [];
      }
    } catch (error) {
      throw new base_cjs.ToolError(`Failed to list collections from Milvus: ${error}`);
    }
  }
  async getCollectionInfo(collectionName) {
    const client = await this.client();
    const response = client.describeCollection({
      collection_name: collectionName
    });
    return response;
  }
  async insert(input) {
    const client = await this.client();
    const response = await client.insert({
      collection_name: input.collectionName,
      fields_data: input.vectors.map((vector, index) => ({
        vector,
        ...input.metadata?.[index]
      }))
    });
    return response;
  }
  async search(input) {
    const client = await this.client();
    const response = await client.search({
      collection_name: input.collectionName,
      vector: input.vector,
      limit: input.topK || 10,
      filter: input.filter,
      output_fields: input.searchOutput
    });
    return response.results;
  }
  async delete(input) {
    const client = await this.client();
    const response = client.delete({
      collection_name: input.collectionName,
      filter: `id in [${input.ids?.join(",")}]`
    });
    return response;
  }
}
_ts_decorate([
  decoratorCache_cjs.Cache(),
  _ts_metadata("design:type", Function),
  _ts_metadata("design:paramtypes", []),
  _ts_metadata("design:returntype", Promise)
], MilvusDatabaseTool.prototype, "client", null);

exports.MilvusAction = MilvusAction;
exports.MilvusDatabaseTool = MilvusDatabaseTool;
//# sourceMappingURL=milvus.cjs.map
//# sourceMappingURL=milvus.cjs.map