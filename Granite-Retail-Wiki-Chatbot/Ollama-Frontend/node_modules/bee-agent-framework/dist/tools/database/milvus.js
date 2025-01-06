import { Tool, ToolInputValidationError, ToolError, JSONToolOutput } from '../base.js';
import { Cache } from '../../cache/decoratorCache.js';
import { MilvusClient } from '@zilliz/milvus2-sdk-node';
import { z } from 'zod';
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
var MilvusAction = /* @__PURE__ */ function(MilvusAction2) {
  MilvusAction2["ListCollections"] = "ListCollections";
  MilvusAction2["GetCollectionInfo"] = "GetCollectionInfo";
  MilvusAction2["Search"] = "Search";
  MilvusAction2["Insert"] = "Insert";
  MilvusAction2["Delete"] = "Delete";
  return MilvusAction2;
}({});
class MilvusDatabaseTool extends Tool {
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
    return z.object({
      action: z.nativeEnum(MilvusAction).describe(`The action to perform. ${"ListCollections"} lists all collections, ${"GetCollectionInfo"} fetches details for a specified collection, ${"Search"} executes a vector search, ${"Insert"} inserts new vectors, and ${"Delete"} removes vectors.`),
      collectionName: z.string().optional().describe(`The name of the collection to query, required for ${"GetCollectionInfo"}, ${"Search"}, ${"Insert"}, and ${"Delete"}`),
      vector: z.array(z.number()).optional().describe(`The vector to search for or insert, required for ${"Search"}`),
      vectors: z.array(z.array(z.number())).optional().describe(`The vectors to insert, required for ${"Insert"}`),
      topK: z.coerce.number().int().min(1).max(1e3).default(10).optional().describe(`The number of nearest neighbors to return for ${"Search"}. Maximum is 1000`),
      filter: z.string().optional().describe(`Optional filter expression for ${"Search"}`),
      metadata: z.record(z.string(), z.any()).optional().describe(`Additional metadata to insert with vectors for ${"Insert"}`),
      ids: z.array(z.string().or(z.number())).optional().describe(`Array of IDs to delete for ${"Delete"}`),
      searchOutput: z.array(z.string()).optional().describe(`Fields to return in search results for ${"Search"}`)
    });
  }
  emitter = Emitter.root.child({
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
      throw new ToolInputValidationError(`Collection name is required for ${"GetCollectionInfo"}, ${"Search"}, ${"Insert"}, and ${"Delete"} actions.`);
    }
    if (input.action === "Search" && (!input.collectionName || !input.vector)) {
      throw new ToolInputValidationError(`Both collection name and vector are required for ${"Search"} action.`);
    }
    if (input.action === "Insert" && (!input.collectionName || !input.vectors)) {
      throw new ToolInputValidationError(`Both collection name and vectors are required for ${"Insert"} action.`);
    }
  }
  static {
    this.register();
  }
  async client() {
    try {
      const client = new MilvusClient(this.options.connection);
      await client.listCollections();
      return client;
    } catch (error) {
      throw new ToolError(`Unable to connect to Milvus.`, [
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
        return new JSONToolOutput(collections);
      }
      case "GetCollectionInfo": {
        if (!input.collectionName) {
          throw new ToolError("A collection name is required for Milvus GetCollectionInfo action");
        }
        const collectionInfo = await this.getCollectionInfo(input.collectionName);
        return new JSONToolOutput(collectionInfo);
      }
      case "Search": {
        if (!input.collectionName || !input.vector) {
          throw new ToolError("A collection name and vector are required for Milvus Search action");
        }
        const searchResults = await this.search(input);
        return new JSONToolOutput(searchResults);
      }
      case "Insert": {
        if (!input.collectionName || !input.vectors) {
          throw new ToolError("A collection name and vectors are required for Milvus Insert action");
        }
        const insertResults = await this.insert(input);
        return new JSONToolOutput(insertResults);
      }
      case "Delete": {
        if (!input.collectionName || !input.ids) {
          throw new ToolError("Collection name and ids are required for Milvus Delete action");
        }
        const deleteResults = await this.delete(input);
        return new JSONToolOutput(deleteResults);
      }
      default: {
        throw new ToolError(`Invalid action specified: ${input.action}`);
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
      throw new ToolError(`Failed to list collections from Milvus: ${error}`);
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
  Cache(),
  _ts_metadata("design:type", Function),
  _ts_metadata("design:paramtypes", []),
  _ts_metadata("design:returntype", Promise)
], MilvusDatabaseTool.prototype, "client", null);

export { MilvusAction, MilvusDatabaseTool };
//# sourceMappingURL=milvus.js.map
//# sourceMappingURL=milvus.js.map