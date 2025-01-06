'use strict';

var crypto = require('node:crypto');
var promises$1 = require('node:stream/promises');
var fs = require('node:fs');
var promises = require('node:fs/promises');
var path = require('node:path');
var decoratorCache_cjs = require('../../cache/decoratorCache.cjs');
var serializable_cjs = require('../../internals/serializable.cjs');
var utils_cjs = require('../../serializer/utils.cjs');

function _interopDefault (e) { return e && e.__esModule ? e : { default: e }; }

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

var crypto__namespace = /*#__PURE__*/_interopNamespace(crypto);
var fs__default = /*#__PURE__*/_interopDefault(fs);
var path__default = /*#__PURE__*/_interopDefault(path);

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
class PythonStorage extends serializable_cjs.Serializable {
  static {
    __name(this, "PythonStorage");
  }
}
class TemporaryStorage extends PythonStorage {
  static {
    __name(this, "TemporaryStorage");
  }
  files = [];
  async list() {
    return this.files.slice();
  }
  async upload(files) {
    return files.map((file) => ({
      id: file.id,
      pythonId: file.id,
      filename: file.filename
    }));
  }
  async download(files) {
    this.files = [
      ...this.files.filter((file) => files.every((f) => f.filename !== file.filename)),
      ...files.map((file) => ({
        id: file.pythonId,
        ...file
      }))
    ];
    return this.files.slice();
  }
  createSnapshot() {
    return {
      files: this.files.slice()
    };
  }
  loadSnapshot(snapshot) {
    Object.assign(this, snapshot);
  }
}
class LocalPythonStorage extends PythonStorage {
  static {
    __name(this, "LocalPythonStorage");
  }
  input;
  constructor(input) {
    super();
    this.input = {
      ...input,
      ignoredFiles: input?.ignoredFiles ?? /* @__PURE__ */ new Set([
        ".gitkeep"
      ])
    };
  }
  async init() {
    await fs__default.default.promises.mkdir(this.input.localWorkingDir, {
      recursive: true
    });
    await fs__default.default.promises.mkdir(this.input.interpreterWorkingDir, {
      recursive: true
    });
  }
  async list() {
    await this.init();
    const files = await fs__default.default.promises.readdir(this.input.localWorkingDir, {
      withFileTypes: true,
      recursive: false
    });
    return Promise.all(files.filter((file) => file.isFile() && !this.input.ignoredFiles.has(file.name)).map(async (file) => {
      const pythonId = await this.computeHash(path__default.default.join(this.input.localWorkingDir.toString(), file.name));
      return {
        id: pythonId,
        filename: file.name,
        pythonId
      };
    }));
  }
  async upload(files) {
    await this.init();
    const fileList = await this.list();
    await Promise.all(files.map((file) => {
      const filesystemFile = fileList.find((filesystemFile2) => filesystemFile2.id === file.id);
      return promises.copyFile(path__default.default.join(this.input.localWorkingDir.toString(), filesystemFile.filename), path__default.default.join(this.input.interpreterWorkingDir.toString(), filesystemFile.id));
    }));
    return files.map((file) => ({
      ...file,
      pythonId: file.id
    }));
  }
  async download(files) {
    await this.init();
    await Promise.all(files.map((file) => promises.copyFile(path__default.default.join(this.input.interpreterWorkingDir.toString(), file.pythonId), path__default.default.join(this.input.localWorkingDir.toString(), file.filename))));
    return files.map((file) => ({
      ...file,
      id: file.pythonId
    }));
  }
  async computeHash(file) {
    const hash = crypto__namespace.createHash("sha256");
    await promises$1.pipeline(fs.createReadStream(file), hash);
    return hash.digest("hex");
  }
  createSnapshot() {
    return {
      input: utils_cjs.shallowCopy(this.input)
    };
  }
  loadSnapshot(snapshot) {
    Object.assign(this, snapshot);
  }
}
_ts_decorate([
  decoratorCache_cjs.Cache(),
  _ts_metadata("design:type", Function),
  _ts_metadata("design:paramtypes", []),
  _ts_metadata("design:returntype", Promise)
], LocalPythonStorage.prototype, "init", null);

exports.LocalPythonStorage = LocalPythonStorage;
exports.PythonStorage = PythonStorage;
exports.TemporaryStorage = TemporaryStorage;
//# sourceMappingURL=storage.cjs.map
//# sourceMappingURL=storage.cjs.map