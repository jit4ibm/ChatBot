import { SpanStatusCode } from '@opentelemetry/api';
import { isEmpty } from 'remeda';

var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
function createSpan({ target, name, data, error, ctx, parent, id, startedAt }) {
  return {
    name,
    attributes: {
      target,
      data: data && !isEmpty(data) ? {
        ...data
      } : null,
      ctx: ctx && !isEmpty(ctx) ? {
        ...ctx
      } : null
    },
    context: {
      span_id: id
    },
    parent_id: parent?.id,
    status: {
      code: error ? SpanStatusCode.ERROR : SpanStatusCode.OK,
      message: error ? error : ""
    },
    start_time: startedAt,
    end_time: performance.now()
  };
}
__name(createSpan, "createSpan");

export { createSpan };
//# sourceMappingURL=create-span.js.map
//# sourceMappingURL=create-span.js.map