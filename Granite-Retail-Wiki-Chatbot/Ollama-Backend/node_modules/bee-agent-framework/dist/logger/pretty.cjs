'use strict';

var pinoPretty = require('pino-pretty');
var picocolors = require('picocolors');

function _interopDefault (e) { return e && e.__esModule ? e : { default: e }; }

var pinoPretty__default = /*#__PURE__*/_interopDefault(pinoPretty);
var picocolors__default = /*#__PURE__*/_interopDefault(picocolors);

var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
const compose = /* @__PURE__ */ __name((...fns) => (value) => fns.reduce((res, f) => f(res), value), "compose");
var pretty_default = /* @__PURE__ */ __name((opts) => {
  return pinoPretty__default.default({
    colorize: true,
    colorizeObjects: true,
    singleLine: true,
    hideObject: false,
    sync: true,
    levelFirst: true,
    ...opts,
    translateTime: "HH:MM:ss",
    customPrettifiers: {
      level: (() => {
        const levels = {
          TRACE: {
            letters: "TRC",
            icon: "\u{1F50E}",
            formatter: picocolors__default.default.gray
          },
          DEBUG: {
            letters: "DBG",
            icon: "\u{1FAB2}",
            formatter: picocolors__default.default.yellow
          },
          INFO: {
            letters: "INF",
            icon: "\u2139\uFE0F",
            formatter: picocolors__default.default.green
          },
          WARN: {
            letters: "WRN",
            icon: "\u26A0\uFE0F",
            formatter: picocolors__default.default.yellow
          },
          ERROR: {
            letters: "ERR",
            icon: "\u{1F525}",
            formatter: picocolors__default.default.red
          },
          FATAL: {
            letters: "FTL",
            icon: "\u{1F4A3}",
            formatter: compose(picocolors__default.default.black, picocolors__default.default.bgRed)
          }
        };
        const fallback = {
          letters: "???",
          icon: "\u{1F937}\u200D",
          formatter: picocolors__default.default.gray
        };
        return (logLevel) => {
          const target = levels[logLevel] || fallback;
          return `${target.formatter(target.letters)}  ${target.icon} `;
        };
      })(),
      time: /* @__PURE__ */ __name((timestamp) => picocolors__default.default.dim(timestamp), "time"),
      caller: /* @__PURE__ */ __name((caller, key, log, { colors }) => `${colors.greenBright(caller)}`, "caller")
    },
    messageFormat: /* @__PURE__ */ __name((log, messageKey) => {
      return `${log[messageKey]}`;
    }, "messageFormat")
  });
}, "default");

module.exports = pretty_default;
//# sourceMappingURL=pretty.cjs.map
//# sourceMappingURL=pretty.cjs.map