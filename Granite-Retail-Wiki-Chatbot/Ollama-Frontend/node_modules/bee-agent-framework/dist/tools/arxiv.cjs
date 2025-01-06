'use strict';

var base_cjs = require('./base.cjs');
var zod = require('zod');
var fetcher_cjs = require('../internals/fetcher.cjs');
var decoratorCache_cjs = require('../cache/decoratorCache.cjs');
var fastXmlParser = require('fast-xml-parser');
var object_cjs = require('../internals/helpers/object.cjs');
var remeda = require('remeda');
var array_cjs = require('../internals/helpers/array.cjs');
var emitter_cjs = require('../emitter/emitter.cjs');

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
const SortType = {
  RELEVANCE: "relevance",
  LAST_UPDATED_DATE: "lastUpdatedDate",
  SUBMITTED_DATE: "submittedDate"
};
const SortOrder = {
  ASCENDING: "ascending",
  DESCENDING: "descending"
};
const FilterType = {
  ALL: "all",
  TITLE: "title",
  AUTHOR: "author",
  ABSTRACT: "abstract",
  COMMENT: "comment",
  JOURNAL_REFERENCE: "journal_reference",
  SUBJECT_CATEGORY: "subject_category",
  REPORT_NUMBER: "report_number"
};
const FilterTypeMapping = {
  all: "all",
  title: "ti",
  author: "au",
  abstract: "abs",
  comment: "co",
  journal_reference: "jr",
  subject_category: "cat",
  report_number: "rn"
};
const Separators = {
  AND: "+AND+",
  OR: "+OR+",
  ANDNOT: "+ANDNOT+"
};
class ArXivToolOutput extends base_cjs.JSONToolOutput {
  static {
    __name(this, "ArXivToolOutput");
  }
  isEmpty() {
    return !this.result || this.result.totalResults === 0 || this.result.entries.length === 0;
  }
}
const extractId = /* @__PURE__ */ __name((value) => value.replace("https://arxiv.org/abs/", "").replace("https://arxiv.org/pdf/", "").replace(/v\d$/, ""), "extractId");
class ArXivTool extends base_cjs.Tool {
  static {
    __name(this, "ArXivTool");
  }
  name = "ArXiv";
  description = `Retrieves research articles published on arXiv including related metadata.`;
  emitter = emitter_cjs.Emitter.root.child({
    namespace: [
      "tool",
      "search",
      "arxiv"
    ],
    creator: this
  });
  inputSchema() {
    const entrySchema = zod.z.object({
      field: zod.z.nativeEnum(FilterType).default(FilterType.ALL),
      value: zod.z.string().min(1)
    });
    return zod.z.object({
      ids: zod.z.array(zod.z.string().min(1)).optional(),
      search_query: zod.z.object({
        include: zod.z.array(entrySchema).nonempty().describe("Filters to include results."),
        exclude: zod.z.array(entrySchema).optional().describe("Filters to exclude results.")
      }).optional(),
      start: zod.z.number().int().min(0).default(0),
      maxResults: zod.z.number().int().min(1).max(100).default(5)
    }).describe("Sorting by date is not supported.");
  }
  static {
    this.register();
  }
  validateInput(schema, rawInput) {
    super.validateInput(schema, rawInput);
    if (remeda.isEmpty(rawInput.ids ?? []) && !rawInput.search_query) {
      throw new base_cjs.ToolInputValidationError(`The 'search_query' property must be non-empty if the 'ids' property is not provided!`);
    }
  }
  _prepareParams(input) {
    return fetcher_cjs.createURLParams({
      start: input.start,
      max_results: input.maxResults,
      id_list: remeda.isEmpty(input.ids ?? []) ? void 0 : input.ids?.map(extractId),
      search_query: input.search_query && [
        input.search_query.include.map((tag) => `${FilterTypeMapping[tag.field]}:${tag.value}`).join(Separators.AND),
        (input.search_query.exclude ?? []).map((tag) => `${FilterTypeMapping[tag.field]}:${tag.value}`).join(Separators.ANDNOT)
      ].filter(Boolean).join(Separators.ANDNOT),
      sortBy: SortType.RELEVANCE,
      sortOrder: SortOrder.DESCENDING
    });
  }
  async _run(input, _options, run) {
    const params = this._prepareParams(input);
    const url = `https://export.arxiv.org/api/query?${decodeURIComponent(params.toString())}`;
    const response = await fetch(url, {
      signal: run.signal
    });
    const data = await this._parseResponse(response);
    return new ArXivToolOutput(data);
  }
  async _parseResponse(response) {
    const parser = new fastXmlParser.XMLParser({
      allowBooleanAttributes: true,
      alwaysCreateTextNode: false,
      attributeNamePrefix: "@_",
      attributesGroupName: false,
      cdataPropName: "#cdata",
      ignoreAttributes: true,
      numberParseOptions: {
        hex: false,
        leadingZeros: true
      },
      parseAttributeValue: false,
      parseTagValue: true,
      preserveOrder: false,
      removeNSPrefix: true,
      textNodeName: "#text",
      trimValues: true,
      ignoreDeclaration: true
    });
    const text = await response.text();
    const parsedData = parser.parse(text);
    if (!response.ok) {
      throw new base_cjs.ToolError("Request to ArXiv API has failed!", [
        new Error(JSON.stringify(object_cjs.getProp(parsedData, [
          "feed",
          "entry"
        ], parsedData), null, 2))
      ]);
    }
    let entries = object_cjs.getProp(parsedData, [
      "feed",
      "entry"
    ], []);
    entries = array_cjs.castArray(entries);
    return {
      totalResults: Math.max(object_cjs.getProp(parsedData, [
        "feed",
        "totalResults"
      ], 0), entries.length),
      startIndex: object_cjs.getProp(parsedData, [
        "feed",
        "startIndex"
      ], 0),
      itemsPerPage: object_cjs.getProp(parsedData, [
        "feed",
        "itemsPerPage"
      ], 0),
      entries: entries.map((entry) => remeda.pickBy({
        id: extractId(entry.id),
        url: entry.id,
        title: entry.title,
        summary: entry.summary,
        published: entry.published,
        updated: entry.updated,
        authors: array_cjs.castArray(entry.author).filter(Boolean).map((author) => ({
          name: author.name,
          affiliation: array_cjs.castArray(author.affiliation ?? [])
        })),
        doi: entry.doi,
        comment: entry.comment,
        journalReference: entry.journal_ref,
        primaryCategory: entry.primary_category,
        categories: array_cjs.castArray(entry.category).filter(Boolean),
        links: array_cjs.castArray(entry.link).filter(Boolean)
      }, remeda.isDefined))
    };
  }
}
_ts_decorate([
  decoratorCache_cjs.Cache(),
  _ts_metadata("design:type", Function),
  _ts_metadata("design:paramtypes", []),
  _ts_metadata("design:returntype", void 0)
], ArXivTool.prototype, "inputSchema", null);

exports.ArXivTool = ArXivTool;
exports.ArXivToolOutput = ArXivToolOutput;
exports.FilterType = FilterType;
exports.Separators = Separators;
exports.SortOrder = SortOrder;
exports.SortType = SortType;
//# sourceMappingURL=arxiv.cjs.map
//# sourceMappingURL=arxiv.cjs.map