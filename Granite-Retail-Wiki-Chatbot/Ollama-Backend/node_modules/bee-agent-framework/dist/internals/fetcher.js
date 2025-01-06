import { FrameworkError } from '../errors.js';
import { Serializable } from './serializable.js';
import { fetchEventSource, EventStreamContentType } from '@ai-zen/node-fetch-event-source';
import { emitterToGenerator } from './helpers/promise.js';
import { doNothing, isPlainObject } from 'remeda';
import { Emitter } from '../emitter/emitter.js';
import { shallowCopy } from '../serializer/utils.js';

var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
class RestfulClientError extends FrameworkError {
  static {
    __name(this, "RestfulClientError");
  }
}
function createURLParams(data) {
  const urlTokenParams = new URLSearchParams();
  for (const [key, value] of Object.entries(data)) {
    if (value === void 0) {
      continue;
    }
    if (Array.isArray(value)) {
      value.forEach((v) => {
        if (v !== void 0) {
          urlTokenParams.append(key, String(v));
        }
      });
    } else if (isPlainObject(value)) {
      urlTokenParams.set(key, createURLParams(value).toString());
    } else {
      urlTokenParams.set(key, String(value));
    }
  }
  return urlTokenParams;
}
__name(createURLParams, "createURLParams");
class RestfulClient extends Serializable {
  static {
    __name(this, "RestfulClient");
  }
  input;
  emitter;
  constructor(input) {
    super(), this.input = input, this.emitter = Emitter.root.child({
      namespace: [
        "internals",
        "restfulClient"
      ],
      creator: this
    });
  }
  async *stream(path, init) {
    const { paths, baseUrl, headers } = this.input;
    const emitter = this.emitter.child({
      groupId: "stream"
    });
    const input = {
      url: new URL(paths[path] ?? path, baseUrl).toString(),
      options: {
        ...init,
        method: "POST",
        headers: await headers().then((raw) => Object.assign(Object.fromEntries(raw.entries()), init?.headers))
      }
    };
    await emitter.emit("streamStart", {
      input
    });
    return yield* emitterToGenerator(async ({ emit }) => fetchEventSource(input.url, {
      ...input.options,
      async onopen(response) {
        if (response.ok && response.headers.get("content-type") === EventStreamContentType) {
          await emitter.emit("streamOpen", {
            input
          });
          return;
        }
        throw new RestfulClientError("Failed to stream!", [], {
          context: {
            url: response.url,
            err: await response.text(),
            response
          },
          isRetryable: response.status >= 400 && response.status < 500 && response.status !== 429
        });
      },
      async onmessage(msg) {
        if (msg?.event === "error") {
          throw new RestfulClientError(`Error during streaming has occurred.`, [], {
            context: msg
          });
        }
        await emitter.emit("streamMessage", {
          input,
          data: msg
        });
        emit(msg);
      },
      onclose() {
      },
      onerror(err) {
        throw new RestfulClientError(`Error during streaming has occurred.`, [
          err
        ]);
      }
    }).then(() => emitter.emit("streamSuccess", {
      input
    })).catch(async (error) => {
      await emitter.emit("streamError", {
        input,
        error
      }).catch(doNothing());
      throw error;
    }).finally(() => emitter.emit("streamDone", {
      input
    })));
  }
  async fetch(path, init) {
    const emitter = this.emitter.child({
      groupId: "fetch"
    });
    const { paths, baseUrl, headers: getHeaders } = this.input;
    const target = new URL(paths[path] ?? path, baseUrl);
    if (init?.searchParams) {
      for (const [key, value] of init.searchParams) {
        target.searchParams.set(key, value);
      }
    }
    const input = {
      url: target.toString(),
      options: {
        ...init,
        headers: await getHeaders().then((raw) => Object.assign(Object.fromEntries(raw.entries()), init?.headers))
      }
    };
    await emitter.emit("fetchStart", {
      input
    });
    try {
      const response = await fetch(input.url, input.options);
      if (!response.ok) {
        throw new RestfulClientError("Fetch has failed", [], {
          context: {
            url: response.url,
            error: await response.text(),
            response
          },
          isRetryable: [
            408,
            503
          ].includes(response.status ?? 500)
        });
      }
      const data = await response.json();
      await emitter.emit("fetchSuccess", {
        response,
        data,
        input
      });
      return data;
    } catch (error) {
      await emitter.emit("fetchError", {
        error,
        input
      });
      throw error;
    } finally {
      await emitter.emit("fetchDone", {
        input
      });
    }
  }
  createSnapshot() {
    return {
      input: shallowCopy(this.input),
      emitter: this.emitter
    };
  }
  loadSnapshot(snapshot) {
    Object.assign(this, snapshot);
  }
}

export { RestfulClient, RestfulClientError, createURLParams };
//# sourceMappingURL=fetcher.js.map
//# sourceMappingURL=fetcher.js.map