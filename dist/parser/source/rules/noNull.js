"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NoNullError = void 0;
const constants_1 = require("../../../constants");
const types_1 = require("../../../types");
class NoNullError {
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
        return `null literals are not allowed.`;
    }
    elaborate() {
        return "They're not part of the Source §1 specs.";
    }
}
exports.NoNullError = NoNullError;
const noNull = {
    name: 'no-null',
    disableFromChapter: types_1.Chapter.SOURCE_2,
    checkers: {
        Literal(node, _ancestors) {
            if (node.value === null) {
                return [new NoNullError(node)];
            }
            else {
                return [];
            }
        }
    }
};
exports.default = noNull;
//# sourceMappingURL=noNull.js.map