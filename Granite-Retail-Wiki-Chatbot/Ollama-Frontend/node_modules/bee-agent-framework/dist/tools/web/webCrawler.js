import { JSONToolOutput, Tool } from '../base.js';
import { z } from 'zod';
import { Cache } from '../../cache/decoratorCache.js';
import { stripHtml } from 'string-strip-html';
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
class WebCrawlerToolOutput extends JSONToolOutput {
  static {
    __name(this, "WebCrawlerToolOutput");
  }
  getTextContent() {
    return [
      `URL: ${this.result.url}`,
      `STATUS: ${this.result.statusCode} (${this.result.statusText})`,
      `CONTENT-TYPE: ${this.result.contentType}`,
      `CONTENT: ${this.result.content}`
    ].join("\n");
  }
}
_ts_decorate([
  Cache(),
  _ts_metadata("design:type", Function),
  _ts_metadata("design:paramtypes", []),
  _ts_metadata("design:returntype", String)
], WebCrawlerToolOutput.prototype, "getTextContent", null);
async function defaultParser(response) {
  const text = await response.text();
  if (text) {
    const contentType = response.headers.get("content-type") ?? "";
    if (contentType.includes("text/html")) {
      return stripHtml(text).result;
    }
  }
  return text || "No Content";
}
__name(defaultParser, "defaultParser");
class WebCrawlerTool extends Tool {
  static {
    __name(this, "WebCrawlerTool");
  }
  name = "WebCrawler";
  description = `Retrieves content of an arbitrary website.`;
  inputSchema() {
    return z.object({
      url: z.string().url().describe("Website URL")
    });
  }
  client;
  parser;
  emitter = Emitter.root.child({
    namespace: [
      "tool",
      "webCrawler"
    ],
    creator: this
  });
  constructor({ client, parser, ...options } = {}) {
    super(options);
    this.client = client ?? fetch;
    this.parser = parser ?? defaultParser;
  }
  async _run({ url }, _options, run) {
    const response = await this.client(url, {
      redirect: "follow",
      ...this.options.request,
      signal: run.signal
    });
    const content = await this.parser(response);
    return new WebCrawlerToolOutput({
      url,
      statusCode: response.status,
      statusText: response.statusText,
      contentType: response.headers.get("content-type") ?? "unknown",
      content
    });
  }
  createSnapshot() {
    return {
      ...super.createSnapshot(),
      client: this.client,
      parser: this.parser
    };
  }
  loadSnapshot({ client, parser, ...snapshot }) {
    super.loadSnapshot(snapshot);
    Object.assign(this, {
      client: client ?? fetch,
      parser: parser ?? defaultParser
    });
  }
}

export { WebCrawlerTool, WebCrawlerToolOutput };
//# sourceMappingURL=webCrawler.js.map
//# sourceMappingURL=webCrawler.js.map