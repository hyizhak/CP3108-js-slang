"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModuleInternalError = exports.ModuleNotFoundError = exports.ModuleConnectionError = exports.UndefinedImportError = void 0;
const runtimeSourceError_1 = require("../errors/runtimeSourceError");
class UndefinedImportError extends runtimeSourceError_1.RuntimeSourceError {
    constructor(symbol, moduleName, node) {
        super(node);
        this.symbol = symbol;
        this.moduleName = moduleName;
    }
    explain() {
        return `'${this.moduleName}' does not contain a definition for '${this.symbol}'`;
    }
    elaborate() {
        return "Check your imports and make sure what you're trying to import exists!";
    }
}
exports.UndefinedImportError = UndefinedImportError;
class ModuleConnectionError extends runtimeSourceError_1.RuntimeSourceError {
    constructor(node) {
        super(node);
    }
    explain() {
        return ModuleConnectionError.message;
    }
    elaborate() {
        return ModuleConnectionError.elaboration;
    }
}
exports.ModuleConnectionError = ModuleConnectionError;
ModuleConnectionError.message = `Unable to get modules.`;
ModuleConnectionError.elaboration = `You should check your Internet connection, and ensure you have used the correct module path.`;
class ModuleNotFoundError extends runtimeSourceError_1.RuntimeSourceError {
    constructor(moduleName, node) {
        super(node);
        this.moduleName = moduleName;
    }
    explain() {
        return `Module "${this.moduleName}" not found.`;
    }
    elaborate() {
        return `
      You should check your import declarations, and ensure that all are valid modules.
    `;
    }
}
exports.ModuleNotFoundError = ModuleNotFoundError;
class ModuleInternalError extends runtimeSourceError_1.RuntimeSourceError {
    constructor(moduleName, error, node) {
        super(node);
        this.moduleName = moduleName;
        this.error = error;
    }
    explain() {
        return `Error(s) occured when executing the module "${this.moduleName}".`;
    }
    elaborate() {
        return `
      You may need to contact with the author for this module to fix this error.
    `;
    }
}
exports.ModuleInternalError = ModuleInternalError;
//# sourceMappingURL=errors.js.map