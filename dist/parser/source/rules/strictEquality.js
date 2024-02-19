"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StrictEqualityError = void 0;
const constants_1 = require("../../../constants");
const types_1 = require("../../../types");
class StrictEqualityError {
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
        if (this.node.operator === '==') {
            return 'Use === instead of ==';
        }
        else {
            return 'Use !== instead of !=';
        }
    }
    elaborate() {
        return '== and != is not a valid operator';
    }
}
exports.StrictEqualityError = StrictEqualityError;
const strictEquality = {
    name: 'strict-equality',
    checkers: {
        BinaryExpression(node, _ancestors) {
            if (node.operator === '==' || node.operator === '!=') {
                return [new StrictEqualityError(node)];
            }
            else {
                return [];
            }
        }
    }
};
exports.default = strictEquality;
//# sourceMappingURL=strictEquality.js.map