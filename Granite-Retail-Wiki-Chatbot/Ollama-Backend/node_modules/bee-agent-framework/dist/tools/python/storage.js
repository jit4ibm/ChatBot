import * as crypto from 'node:crypto';
import { pipeline } from 'node:stream/promises';
import fs, { createReadStream } from 'node:fs';
import { copyFile } from 'node:fs/promises';
import path from 'node:path';
import { Cache } from '../../cache/decoratorCache.js';
import { Serializable } from '../../internals/serializable.js';
import { shallowCopy } from '../../serializer/utils.js';

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
class PythonStorage extends Serializable {
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
    await fs.promises.mkdir(this.input.localWorkingDir, {
      recursive: true
    });
    await fs.promises.mkdir(this.input.interpreterWorkingDir, {
      recursive: true
    });
  }
  async list() {
    await this.init();
    const files = await fs.promises.readdir(this.input.localWorkingDir, {
      withFileTypes: true,
      recursive: false
    });
    return Promise.all(files.filter((file) => file.isFile() && !this.input.ignoredFiles.has(file.name)).map(async (file) => {
      const pythonId = await this.computeHash(path.join(this.input.localWorkingDir.toString(), file.name));
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
      return copyFile(path.join(this.input.localWorkingDir.toString(), filesystemFile.filename), path.join(this.input.interpreterWorkingDir.toString(), filesystemFile.id));
    }));
    return files.map((file) => ({
      ...file,
      pythonId: file.id
    }));
  }
  async download(files) {
    await this.init();
    await Promise.all(files.map((file) => copyFile(path.join(this.input.interpreterWorkingDir.toString(), file.pythonId), path.join(this.input.localWorkingDir.toString(), file.filename))));
    return files.map((file) => ({
      ...file,
      id: file.pythonId
    }));
  }
  async computeHash(file) {
    const hash = crypto.createHash("sha256");
    await pipeline(createReadStream(file), hash);
    return hash.digest("hex");
  }
  createSnapshot() {
    return {
      input: shallowCopy(this.input)
    };
  }
  loadSnapshot(snapshot) {
    Object.assign(this, snapshot);
  }
}
_ts_decorate([
  Cache(),
  _ts_metadata("design:type", Function),
  _ts_metadata("design:paramtypes", []),
  _ts_metadata("design:returntype", Promise)
], LocalPythonStorage.prototype, "init", null);

export { LocalPythonStorage, PythonStorage, TemporaryStorage };
//# sourceMappingURL=storage.js.map
//# sourceMappingURL=storage.js.map