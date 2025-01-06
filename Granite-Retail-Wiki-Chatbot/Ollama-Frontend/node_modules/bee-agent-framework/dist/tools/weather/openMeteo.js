import { JSONToolOutput, Tool, ToolError, ToolInputValidationError } from '../base.js';
import { z } from 'zod';
import { createURLParams } from '../../internals/fetcher.js';
import { omit, pickBy, isNullish, pick } from 'remeda';
import { Cache } from '../../cache/decoratorCache.js';
import { getProp, setProp } from '../../internals/helpers/object.js';
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
class OpenMeteoToolOutput extends JSONToolOutput {
  static {
    __name(this, "OpenMeteoToolOutput");
  }
}
class OpenMeteoTool extends Tool {
  static {
    __name(this, "OpenMeteoTool");
  }
  name = "OpenMeteo";
  description = `Retrieve current, past, or future weather forecasts for a location.`;
  inputSchema() {
    return z.object({
      location: z.union([
        z.object({
          name: z.string().min(1),
          country: z.string().optional(),
          language: z.string().default("English")
        }).strip(),
        z.object({
          latitude: z.coerce.number(),
          longitude: z.coerce.number()
        }).strip()
      ]),
      start_date: z.string().date().describe("Start date for the weather forecast in the format YYYY-MM-DD (UTC)"),
      end_date: z.string().date().describe("End date for the weather forecast in the format YYYY-MM-DD (UTC)").optional(),
      temperature_unit: z.enum([
        "celsius",
        "fahrenheit"
      ]).default("celsius")
    }).strip();
  }
  emitter = Emitter.root.child({
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
      const value = getProp(rawInput, [
        key
      ]);
      if (value) {
        setProp(rawInput, [
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
          return pick(response2, [
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
            throw new ToolInputValidationError(`The 'end_date' (${endDateStr}) has to occur on or after the 'start_date' (${startDateStr}).`);
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
      return createURLParams({
        ...pickBy(input, (v) => !isNullish(v) && v !== ""),
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
      throw new ToolError("Request to OpenMeteo API has failed!", [
        new Error(await response.text())
      ]);
    }
    let data = await response.json();
    if (this.options?.responseFilter?.excludedKeys) {
      data = omit(data, this.options.responseFilter.excludedKeys);
    }
    return new OpenMeteoToolOutput(data);
  }
  async _geocode(location, signal) {
    const { apiKey } = this.options;
    const params = createURLParams({
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
      throw new ToolError(`Failed to GeoCode provided location (${location.name}).`, [
        new Error(await response.text())
      ]);
    }
    const { results } = await response.json();
    if (!results || results.length === 0) {
      throw new ToolError(`Location '${location.name}' was not found.`);
    }
    return results[0];
  }
}
_ts_decorate([
  Cache(),
  _ts_metadata("design:type", Function),
  _ts_metadata("design:paramtypes", [
    typeof LocationSearch === "undefined" ? Object : LocationSearch,
    typeof AbortSignal === "undefined" ? Object : AbortSignal
  ]),
  _ts_metadata("design:returntype", Promise)
], OpenMeteoTool.prototype, "_geocode", null);

export { OpenMeteoTool, OpenMeteoToolOutput };
//# sourceMappingURL=openMeteo.js.map
//# sourceMappingURL=openMeteo.js.map