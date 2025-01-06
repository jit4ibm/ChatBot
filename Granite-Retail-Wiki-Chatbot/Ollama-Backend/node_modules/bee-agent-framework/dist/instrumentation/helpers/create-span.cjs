'use strict';

var api = require('@opentelemetry/api');
var remeda = require('remeda');

var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
function createSpan({ target, name, data, error, ctx, parent, id, startedAt }) {
  return {
    name,
    attributes: {
      target,
      data: data && !remeda.isEmpty(data) ? {
        ...data
      } : null,
      ctx: ctx && !remeda.isEmpty(ctx) ? {
        ...ctx
      } : null
    },
    context: {
      span_id: id
    },
    parent_id: parent?.id,
    status: {
      code: error ? api.SpanStatusCode.ERROR : api.SpanStatusCode.OK,
      message: error ? error : ""
    },
    start_time: startedAt,
    end_time: performance.now()
  };
}
__name(createSpan, "createSpan");

exports.createSpan = createSpan;
//# sourceMappingURL=create-span.cjs.map
//# sourceMappingURL=create-span.cjs.map