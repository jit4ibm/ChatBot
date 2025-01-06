import * as R from 'remeda';
import { unique, isString } from 'remeda';
import { ValueError } from '../../errors.js';

var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
function* splitString(text, options) {
  yield* recursiveSplitString(text, {
    ...options,
    trim: options?.trim ?? false,
    separators: []
  });
}
__name(splitString, "splitString");
function* mergeStrings(chunks, sep, options) {
  const tmpChunks = [];
  let tmpOverlap = 0;
  const toDoc = /* @__PURE__ */ __name((parts) => {
    const text = parts.join(sep);
    return options.trim ? text.trim() : text;
  }, "toDoc");
  for (const chunk of chunks) {
    if (tmpOverlap + chunk.length + tmpChunks.length * sep.length > options.size) {
      if (tmpChunks.length > 0) {
        const doc2 = toDoc(tmpChunks);
        if (doc2) {
          yield doc2;
        }
        while (tmpOverlap > options.overlap || tmpOverlap + chunk.length + tmpChunks.length * sep.length > options.size && tmpOverlap > 0) {
          const tmp = tmpChunks.shift();
          tmpOverlap -= tmp.length;
        }
      }
    }
    tmpChunks.push(chunk);
    tmpOverlap += chunk.length;
  }
  const doc = toDoc(tmpChunks);
  if (doc) {
    yield doc;
  }
}
__name(mergeStrings, "mergeStrings");
function* recursiveSplitString(text, options) {
  if (options.size <= 0 || options.overlap < 0) {
    throw new Error("size must be positive and overlap must be non-negative");
  }
  if (options.overlap >= options.size) {
    throw new Error("overlap must be less than size");
  }
  const goodSplits = [];
  const [separator, ...remainingSeparators] = unique([
    ...options.separators ?? [],
    ""
  ]);
  for (const chunk of text.split(separator).filter(Boolean)) {
    if (chunk.length < options.size) {
      goodSplits.push(chunk);
      continue;
    }
    if (goodSplits.length > 0) {
      yield* mergeStrings(goodSplits, separator, options);
      goodSplits.length = 0;
    }
    if (remainingSeparators.length === 0) {
      yield chunk;
    } else {
      yield* recursiveSplitString(chunk, {
        ...options,
        separators: remainingSeparators
      });
    }
  }
  if (goodSplits.length > 0) {
    yield* mergeStrings(goodSplits, separator, options);
  }
}
__name(recursiveSplitString, "recursiveSplitString");
const Comparator = {
  EQ: [
    0
  ],
  GT: [
    1
  ],
  GTE: [
    0,
    1
  ],
  LT: [
    -1
  ],
  LTE: [
    -1,
    0
  ]
};
function compareVersion(a, comparator, b) {
  const diff = a.replace("v", "").trim().localeCompare(b.replace("v", "").trim(), void 0, {
    numeric: true,
    sensitivity: "base"
  });
  const diffNormalized = Math.min(1, Math.max(-1, diff));
  return R.isIncludedIn(diffNormalized, comparator);
}
__name(compareVersion, "compareVersion");
function isJsonLikeString(value) {
  if (!value) {
    return false;
  }
  return value.startsWith("{") && value.endsWith("}");
}
__name(isJsonLikeString, "isJsonLikeString");
function halveString(value, seq, includeSeq = false) {
  if (seq === "") {
    return [
      value
    ];
  }
  const index = value.indexOf(seq);
  if (index === -1) {
    return [
      value
    ];
  } else {
    return [
      value.slice(0, index),
      value.slice(index + (includeSeq ? 0 : seq.length))
    ];
  }
}
__name(halveString, "halveString");
function countSharedStartEndLetters(a, b) {
  if (!isString(a) || !isString(b)) {
    throw new ValueError("Provided values must be all strings.");
  }
  const minLength = Math.min(a.length, b.length);
  for (let i = 0; i < minLength; i++) {
    if (a.at((i + 1) * -1) !== b.at(i)) {
      return i;
    }
  }
  return minLength;
}
__name(countSharedStartEndLetters, "countSharedStartEndLetters");
function findFirstPair(text, pair, options = {}) {
  const [opening, closing] = pair || [];
  if (!pair || !opening || !closing) {
    throw new ValueError(`The "pair" parameter is required and must be non-empty!`);
  }
  let balance = 0;
  let startIndex = -1;
  const pairOverlap = options.allowOverlap ? countSharedStartEndLetters(opening, closing) : 0;
  const isSame = opening === closing;
  for (let index = 0; index < text.length; index++) {
    if (text.substring(index, index + opening.length) === opening && (!isSame || balance === 0)) {
      if (balance === 0) {
        startIndex = index;
      }
      balance++;
      if (!options.allowOverlap) {
        index += opening.length - 1;
      }
    } else if (text.substring(index, index + closing.length) === closing) {
      if (balance > 0) {
        balance--;
        if (balance === 0) {
          const inner = {
            start: startIndex + opening.length,
            get end() {
              let innerEnd = index;
              const innerSize = innerEnd - this.start;
              if (innerSize < 0) {
                innerEnd = this.start;
              } else {
                innerEnd += pairOverlap;
              }
              return innerEnd;
            }
          };
          return {
            start: startIndex,
            end: index + closing.length,
            pair,
            inner: text.substring(inner.start, inner.end),
            outer: text.substring(startIndex, index + closing.length)
          };
        }
      }
      if (!options.allowOverlap) {
        index += closing.length - 1;
      }
    }
  }
  return null;
}
__name(findFirstPair, "findFirstPair");

export { Comparator, compareVersion, countSharedStartEndLetters, findFirstPair, halveString, isJsonLikeString, mergeStrings, recursiveSplitString, splitString };
//# sourceMappingURL=string.js.map
//# sourceMappingURL=string.js.map