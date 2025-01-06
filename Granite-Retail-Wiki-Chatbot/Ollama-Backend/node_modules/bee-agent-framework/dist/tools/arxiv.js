import { JSONToolOutput, Tool, ToolInputValidationError, ToolError } from './base.js';
import { z } from 'zod';
import { createURLParams } from '../internals/fetcher.js';
import { Cache } from '../cache/decoratorCache.js';
import { XMLParser } from 'fast-xml-parser';
import { getProp } from '../internals/helpers/object.js';
import { isEmpty, pickBy, isDefined } from 'remeda';
import { castArray } from '../internals/helpers/array.js';
import { Emitter } from '../emitter/emitter.js';

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
class ArXivToolOutput extends JSONToolOutput {
  static {
    __name(this, "ArXivToolOutput");
  }
  isEmpty() {
    return !this.result || this.result.totalResults === 0 || this.result.entries.length === 0;
  }
}
const extractId = /* @__PURE__ */ __name((value) => value.replace("https://arxiv.org/abs/", "").replace("https://arxiv.org/pdf/", "").replace(/v\d$/, ""), "extractId");
class ArXivTool extends Tool {
  static {
    __name(this, "ArXivTool");
  }
  name = "ArXiv";
  description = `Retrieves research articles published on arXiv including related metadata.`;
  emitter = Emitter.root.child({
    namespace: [
      "tool",
      "search",
      "arxiv"
    ],
    creator: this
  });
  inputSchema() {
    const entrySchema = z.object({
      field: z.nativeEnum(FilterType).default(FilterType.ALL),
      value: z.string().min(1)
    });
    return z.object({
      ids: z.array(z.string().min(1)).optional(),
      search_query: z.object({
        include: z.array(entrySchema).nonempty().describe("Filters to include results."),
        exclude: z.array(entrySchema).optional().describe("Filters to exclude results.")
      }).optional(),
      start: z.number().int().min(0).default(0),
      maxResults: z.number().int().min(1).max(100).default(5)
    }).describe("Sorting by date is not supported.");
  }
  static {
    this.register();
  }
  validateInput(schema, rawInput) {
    super.validateInput(schema, rawInput);
    if (isEmpty(rawInput.ids ?? []) && !rawInput.search_query) {
      throw new ToolInputValidationError(`The 'search_query' property must be non-empty if the 'ids' property is not provided!`);
    }
  }
  _prepareParams(input) {
    return createURLParams({
      start: input.start,
      max_results: input.maxResults,
      id_list: isEmpty(input.ids ?? []) ? void 0 : input.ids?.map(extractId),
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
    const parser = new XMLParser({
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
      throw new ToolError("Request to ArXiv API has failed!", [
        new Error(JSON.stringify(getProp(parsedData, [
          "feed",
          "entry"
        ], parsedData), null, 2))
      ]);
    }
    let entries = getProp(parsedData, [
      "feed",
      "entry"
    ], []);
    entries = castArray(entries);
    return {
      totalResults: Math.max(getProp(parsedData, [
        "feed",
        "totalResults"
      ], 0), entries.length),
      startIndex: getProp(parsedData, [
        "feed",
        "startIndex"
      ], 0),
      itemsPerPage: getProp(parsedData, [
        "feed",
        "itemsPerPage"
      ], 0),
      entries: entries.map((entry) => pickBy({
        id: extractId(entry.id),
        url: entry.id,
        title: entry.title,
        summary: entry.summary,
        published: entry.published,
        updated: entry.updated,
        authors: castArray(entry.author).filter(Boolean).map((author) => ({
          name: author.name,
          affiliation: castArray(author.affiliation ?? [])
        })),
        doi: entry.doi,
        comment: entry.comment,
        journalReference: entry.journal_ref,
        primaryCategory: entry.primary_category,
        categories: castArray(entry.category).filter(Boolean),
        links: castArray(entry.link).filter(Boolean)
      }, isDefined))
    };
  }
}
_ts_decorate([
  Cache(),
  _ts_metadata("design:type", Function),
  _ts_metadata("design:paramtypes", []),
  _ts_metadata("design:returntype", void 0)
], ArXivTool.prototype, "inputSchema", null);

export { ArXivTool, ArXivToolOutput, FilterType, Separators, SortOrder, SortType };
//# sourceMappingURL=arxiv.js.map
//# sourceMappingURL=arxiv.js.map