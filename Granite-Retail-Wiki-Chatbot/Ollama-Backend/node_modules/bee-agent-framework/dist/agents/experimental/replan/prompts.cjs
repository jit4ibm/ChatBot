'use strict';

var zod = require('zod');
var template_cjs = require('../../../template.cjs');
var remeda = require('remeda');
var schema_cjs = require('../../../internals/helpers/schema.cjs');
var zodToJsonSchema = require('zod-to-json-schema');

var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
async function createRePlanOutputSchema(tools) {
  const toolSchemas = await Promise.all(tools.map(async (tool) => ({
    name: tool.name,
    description: tool.description,
    input: zod.z.object({}).passthrough(),
    inputSchema: await tool.getInputJsonSchema()
  })));
  const zodSchemaToJsonSchema = new WeakMap(toolSchemas.map((tool) => [
    tool.input.shape,
    tool.inputSchema
  ]));
  const definition = zod.z.object({
    information: zod.z.record(zod.z.string()).describe("Summary of the factual information that was collected so far. Eg. 'height of the Eiffel tower': '300m'. Only information that was provided by tools or the user in this very conversation is allowed to be included here. Other information must not be included."),
    lookback: zod.z.string().describe("A full summary of what has happened so far, focusing on what the assistant tried, what went well and what failed. This repeats in every message, but always concerns the full history up to that point."),
    plan: zod.z.array(zod.z.object({
      title: zod.z.string().describe("Title of this step, shortly describing what needs to be done."),
      decision: zod.z.string().describe("Assistant's decision of how to tackle this step."),
      research: zod.z.boolean().describe("Does this step involve looking up factual information through tools?"),
      computation: zod.z.boolean().describe("Does this step involve calculating or computing information through tools?")
    })).describe("Detailed step-by-step plan of what steps will the assistant take from start to finish to fulfill the user's request. Includes concrete facts and numbers wherever possible. This repeats in every message, but always contains all the future steps from this point on."),
    nextStep: zod.z.discriminatedUnion("type", [
      zod.z.object({
        type: zod.z.literal("message"),
        message: zod.z.string().describe("Message with the response, that is sent back to the user. Always include a bit of info on how you arrived at the answer. Be friendly and helpful.")
      }).describe("Message the user -- either to give the answer, or to ask for more information."),
      ...remeda.hasAtLeast(toolSchemas, 1) ? [
        zod.z.object({
          type: zod.z.literal("tool"),
          calls: zod.z.array(zod.z.discriminatedUnion("name", remeda.map(toolSchemas, (tool) => zod.z.object({
            name: zod.z.literal(tool.name),
            input: tool.input
          }).describe(tool.description))))
        }).describe("Obtain more information using tools.")
      ] : []
    ])
  });
  return {
    definition,
    json: schema_cjs.toJsonSchema(definition, {
      override: /* @__PURE__ */ __name((_def) => {
        const def = _def;
        if (def.typeName === zod.ZodFirstPartyTypeKind.ZodObject) {
          const shape = def.shape();
          const schema = zodSchemaToJsonSchema.get(shape);
          if (schema) {
            zodSchemaToJsonSchema.delete(shape);
            return schema;
          }
        }
        return zodToJsonSchema.ignoreOverride;
      }, "override")
    })
  };
}
__name(createRePlanOutputSchema, "createRePlanOutputSchema");
const RePlanSystemPrompt = new template_cjs.PromptTemplate({
  schema: zod.z.object({
    schema: zod.z.string()
  }),
  template: `The assistant is created by IBM and refers to itself as Bee. It's named after the IBM logo.

The assistant is very intelligent and helpful. It always thinks ahead, and uses smart approaches to solve the user's problems. The assistant is an expert-level user of the provided tools, and can utilize them to their maximum potential.

The assistant is forbidden from using factual information that was not provided by the user or tools in this very conversation. All information about places, people, events, etc. is unknown to the assistant, and the assistant must use tools to obtain it.

Output Schema: {{schema}}`
});
const RePlanAssistantPrompt = new template_cjs.PromptTemplate({
  schema: zod.z.object({
    results: zod.z.string()
  }),
  template: `{{results}}`
});

exports.RePlanAssistantPrompt = RePlanAssistantPrompt;
exports.RePlanSystemPrompt = RePlanSystemPrompt;
exports.createRePlanOutputSchema = createRePlanOutputSchema;
//# sourceMappingURL=prompts.cjs.map
//# sourceMappingURL=prompts.cjs.map