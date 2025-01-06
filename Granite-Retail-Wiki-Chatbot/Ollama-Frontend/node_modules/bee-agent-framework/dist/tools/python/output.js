import { ToolOutput } from '../base.js';

var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
class PythonToolOutput extends ToolOutput {
  static {
    __name(this, "PythonToolOutput");
  }
  stdout;
  stderr;
  exitCode;
  outputFiles;
  static FILE_PREFIX = "urn:bee:file";
  constructor(stdout, stderr, exitCode, outputFiles = []) {
    super(), this.stdout = stdout, this.stderr = stderr, this.exitCode = exitCode, this.outputFiles = outputFiles;
  }
  static {
    this.register();
  }
  isEmpty() {
    return false;
  }
  getTextContent() {
    const executionStatus = this.exitCode === 0 ? "The code executed successfully." : `The code exited with error code ${this.exitCode}.`;
    const stdout = this.stdout.trim() ? `Standard output: 
\`\`\`
${this.stdout}
\`\`\`` : null;
    const stderr = this.stderr.trim() ? `Error output: 
\`\`\`
${this.stderr}
\`\`\`` : null;
    const isImage = /* @__PURE__ */ __name((filename) => [
      ".png",
      ".jpg",
      ".jpeg",
      ".gif",
      ".bmp"
    ].some((ext) => filename.toLowerCase().endsWith(ext)), "isImage");
    const files = this.outputFiles.length ? "The following files were created or modified. The user does not see them yet. To present a file to the user, send them the link below, verbatim:\n" + this.outputFiles.map((file) => `${isImage(file.filename) ? "!" : ""}[${file.filename}](${PythonToolOutput.FILE_PREFIX}:${file.id})`).join("\n") : null;
    return [
      executionStatus,
      stdout,
      stderr,
      files
    ].filter(Boolean).join("\n");
  }
  createSnapshot() {
    return {
      stdout: this.stdout,
      stderr: this.stderr,
      exitCode: this.exitCode,
      outputFiles: this.outputFiles
    };
  }
  loadSnapshot(snapshot) {
    Object.assign(this, snapshot);
  }
}

export { PythonToolOutput };
//# sourceMappingURL=output.js.map
//# sourceMappingURL=output.js.map