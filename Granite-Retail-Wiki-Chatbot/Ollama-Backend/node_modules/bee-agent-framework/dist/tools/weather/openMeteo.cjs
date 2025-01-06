'use strict';

var base_cjs = require('../base.cjs');
var zod = require('zod');
var fetcher_cjs = require('../../internals/fetcher.cjs');
var remeda = require('remeda');
var decoratorCache_cjs = require('../../cache/decoratorCache.cjs');
var object_cjs = require('../../internals/helpers/object.cjs');
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
class OpenMeteoToolOutput extends base_cjs.JSONToolOutput {
  static {
    __name(this, "OpenMeteoToolOutput");
  }
}
class OpenMeteoTool extends base_cjs.Tool {
  static {
    __name(this, "OpenMeteoTool");
  }
  name = "OpenMeteo";
  description = `Retrieve current, past, or future weather forecasts for a location.`;
  inputSchema() {
    return zod.z.object({
      location: zod.z.union([
        zod.z.object({
          name: zod.z.string().min(1),
          country: zod.z.string().optional(),
          language: zod.z.string().default("English")
        }).strip(),
        zod.z.object({
          latitude: zod.z.coerce.number(),
          longitude: zod.z.coerce.number()
        }).strip()
      ]),
      start_date: zod.z.string().date().describe("Start date for the weather forecast in the format YYYY-MM-DD (UTC)"),
      end_date: zod.z.string().date().describe("End date for the weather forecast in the format YYYY-MM-DD (UTC)").optional(),
      temperature_unit: zod.z.enum([
        "celsius",
        "fahrenheit"
      ]).default("celsius")
    }).strip();
  }
  emitter = emitter_cjs.Emitter.root.child({
    namespace: [
      "tool",
      "weather",
      "openMeteo"
    ],
    creator: this
  });
  static {
    this.register();
  }
  constructor(options = {}) {
    super({
      ...options,
      responseFilter: options?.responseFilter ?? {
        excludedKeys: [
          "latitude",
          "longitude",
          "generationtime_ms",
          "utc_offset_seconds",
          "timezone",
          "timezone_abbreviation",
          "elevation",
          "hourly",
          "hourly_units"
        ]
      }
    });
  }
  preprocessInput(rawInput) {
    super.preprocessInput(rawInput);
    const fixDate = /* @__PURE__ */ __name((key) => {
      const value = object_cjs.getProp(rawInput, [
        key
      ]);
      if (value) {
        object_cjs.setProp(rawInput, [
          key
        ], value.substring(0, 10));
      }
    }, "fixDate");
    fixDate("start_date");
    fixDate("end_date");
  }
  async _run({ location, start_date: startDate, end_date: endDate, ...input }, _options, run) {
    const { apiKey } = this.options;
    const prepareParams = /* @__PURE__ */ __name(async () => {
      const extractLocation = /* @__PURE__ */ __name(async () => {
        if ("name" in location) {
          const response2 = await this._geocode(location, run.signal);
          return remeda.pick(response2, [
            "latitude",
            "longitude"
          ]);
        }
        return location;
      }, "extractLocation");
      function validateAndSetDates(startDateStr, endDateStr) {
        const now = /* @__PURE__ */ new Date();
        const start2 = startDateStr ? new Date(startDateStr) : new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
        if (endDateStr) {
          const end2 = new Date(endDateStr);
          if (end2 < start2) {
            throw new base_cjs.ToolInputValidationError(`The 'end_date' (${endDateStr}) has to occur on or after the 'start_date' (${startDateStr}).`);
          }
          return {
            start: start2,
            end: end2
          };
        } else {
          return {
            start: start2,
            end: new Date(start2)
          };
        }
      }
      __name(validateAndSetDates, "validateAndSetDates");
      const { start, end } = validateAndSetDates(startDate, endDate);
      const toDateString = /* @__PURE__ */ __name((date) => date.toISOString().split("T")[0], "toDateString");
      return fetcher_cjs.createURLParams({
        ...remeda.pickBy(input, (v) => !remeda.isNullish(v) && v !== ""),
        ...await extractLocation(),
        start_date: toDateString(start),
        end_date: toDateString(end),
        current: [
          "temperature_2m",
          "rain",
          "relative_humidity_2m",
          "wind_speed_10m"
        ],
        daily: [
          "temperature_2m_max",
          "temperature_2m_min",
          "rain_sum"
        ],
        hourly: [
          "temperature_2m",
          "relative_humidity_2m",
          "rain"
        ],
        timezone: "UTC"
      });
    }, "prepareParams");
    const params = await prepareParams();
    const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`, {
      headers: {
        ...apiKey && {
          Authorization: `Bearer ${apiKey}`
        }
      },
      signal: run.signal
    });
    if (!response.ok) {
      throw new base_cjs.ToolError("Request to OpenMeteo API has failed!", [
        new Error(await response.text())
      ]);
    }
    let data = await response.json();
    if (this.options?.responseFilter?.excludedKeys) {
      data = remeda.omit(data, this.options.responseFilter.excludedKeys);
    }
    return new OpenMeteoToolOutput(data);
  }
  async _geocode(location, signal) {
    const { apiKey } = this.options;
    const params = fetcher_cjs.createURLParams({
      name: location.name,
      language: location.language,
      country: location.country,
      format: "json",
      count: 1
    });
    const response = await fetch(`https://geocoding-api.open-meteo.com/v1/search?${params}`, {
      headers: {
        ...apiKey && {
          Authorization: `Bearer ${apiKey}`
        }
      },
      signal
    });
    if (!response.ok) {
      throw new base_cjs.ToolError(`Failed to GeoCode provided location (${location.name}).`, [
        new Error(await response.text())
      ]);
    }
    const { results } = await response.json();
    if (!results || results.length === 0) {
      throw new base_cjs.ToolError(`Location '${location.name}' was not found.`);
    }
    return results[0];
  }
}
_ts_decorate([
  decoratorCache_cjs.Cache(),
  _ts_metadata("design:type", Function),
  _ts_metadata("design:paramtypes", [
    typeof LocationSearch === "undefined" ? Object : LocationSearch,
    typeof AbortSignal === "undefined" ? Object : AbortSignal
  ]),
  _ts_metadata("design:returntype", Promise)
], OpenMeteoTool.prototype, "_geocode", null);

exports.OpenMeteoTool = OpenMeteoTool;
exports.OpenMeteoToolOutput = OpenMeteoToolOutput;
//# sourceMappingURL=openMeteo.cjs.map
//# sourceMappingURL=openMeteo.cjs.map