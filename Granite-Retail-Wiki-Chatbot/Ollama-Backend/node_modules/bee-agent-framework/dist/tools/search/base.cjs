'use strict';

var base_cjs = require('../base.cjs');
var decoratorCache_cjs = require('../../cache/decoratorCache.cjs');
var R = require('remeda');

function _interopNamespace(e) {
  if (e && e.__esModule) return e;
  var n = Object.create(null);
  if (e) {
    Object.keys(e).forEach(function (k) {
      if (k !== 'default') {
        var d = Object.getOwnPropertyDescriptor(e, k);
        Object.defineProperty(n, k, d.get ? d : {
          enumerable: true,
          get: function () { return e[k]; }
        });
      }
    });
  }
  n.default = e;
  return Object.freeze(n);
}

var R__namespace = /*#__PURE__*/_interopNamespace(R);

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
class SearchToolOutput extends base_cjs.ToolOutput {
  static {
    __name(this, "SearchToolOutput");
  }
  results;
  constructor(results) {
    super(), this.results = results;
  }
  get sources() {
    return R__namespace.unique(this.results.map((result) => result.url));
  }
  isEmpty() {
    return this.results.length === 0;
  }
  getTextContent() {
    return this.results.map((result) => JSON.stringify(result, null, 2)).join("\n\n");
  }
}
_ts_decorate([
  decoratorCache_cjs.Cache({
    cacheKey: decoratorCache_cjs.WeakRefKeyFn.from((self) => self.results),
    enumerable: false
  }),
  _ts_metadata("design:type", void 0),
  _ts_metadata("design:paramtypes", [])
], SearchToolOutput.prototype, "sources", null);
_ts_decorate([
  decoratorCache_cjs.Cache({
    cacheKey: decoratorCache_cjs.WeakRefKeyFn.from((self) => self.results)
  }),
  _ts_metadata("design:type", Function),
  _ts_metadata("design:paramtypes", []),
  _ts_metadata("design:returntype", String)
], SearchToolOutput.prototype, "getTextContent", null);

exports.SearchToolOutput = SearchToolOutput;
//# sourceMappingURL=base.cjs.map
//# sourceMappingURL=base.cjs.map