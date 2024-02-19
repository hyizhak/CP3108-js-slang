"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RuntimeSourceError = void 0;
const constants_1 = require("../constants");
const types_1 = require("../types");
class RuntimeSourceError {
    constructor(node) {
        var _a;
        this.type = types_1.ErrorType.RUNTIME;
        this.severity = types_1.ErrorSeverity.ERROR;
        this.location = (_a = node === null || node === void 0 ? void 0 : node.loc) !== null && _a !== void 0 ? _a : constants_1.UNKNOWN_LOCATION;
    }
    explain() {
        return '';
    }
    elaborate() {
        return this.explain();
    }
}
exports.RuntimeSourceError = RuntimeSourceError;
//# sourceMappingURL=runtimeSourceError.js.map