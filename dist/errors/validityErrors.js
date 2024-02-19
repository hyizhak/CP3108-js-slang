"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NoAssignmentToForVariable = void 0;
const constants_1 = require("../constants");
const types_1 = require("../types");
class NoAssignmentToForVariable {
    constructor(node) {
        this.node = node;
        this.type = types_1.ErrorType.SYNTAX;
        this.severity = types_1.ErrorSeverity.ERROR;
    }
    get location() {
        var _a;
        return (_a = this.node.loc) !== null && _a !== void 0 ? _a : constants_1.UNKNOWN_LOCATION;
    }
    explain() {
        return 'Assignment to a for loop variable in the for loop is not allowed.';
    }
    elaborate() {
        return this.explain();
    }
}
exports.NoAssignmentToForVariable = NoAssignmentToForVariable;
//# sourceMappingURL=validityErrors.js.map