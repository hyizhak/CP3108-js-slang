"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NoUnspecifiedOperatorError = void 0;
const constants_1 = require("../../../constants");
const types_1 = require("../../../types");
class NoUnspecifiedOperatorError {
    constructor(node) {
        this.node = node;
        this.type = types_1.ErrorType.SYNTAX;
        this.severity = types_1.ErrorSeverity.ERROR;
        this.unspecifiedOperator = node.operator;
    }
    get location() {
        var _a;
        return (_a = this.node.loc) !== null && _a !== void 0 ? _a : constants_1.UNKNOWN_LOCATION;
    }
    explain() {
        return `Operator '${this.unspecifiedOperator}' is not allowed.`;
    }
    elaborate() {
        return '';
    }
}
exports.NoUnspecifiedOperatorError = NoUnspecifiedOperatorError;
const noUnspecifiedOperator = {
    name: 'no-unspecified-operator',
    checkers: {
        BinaryExpression(node, _ancestors) {
            const permittedOperators = [
                '+',
                '-',
                '*',
                '/',
                '%',
                '===',
                '!==',
                '<',
                '>',
                '<=',
                '>=',
                '&&',
                '||'
            ];
            if (!permittedOperators.includes(node.operator)) {
                return [new NoUnspecifiedOperatorError(node)];
            }
            else {
                return [];
            }
        },
        UnaryExpression(node) {
            const permittedOperators = ['-', '!', 'typeof'];
            if (!permittedOperators.includes(node.operator)) {
                return [new NoUnspecifiedOperatorError(node)];
            }
            else {
                return [];
            }
        }
    }
};
exports.default = noUnspecifiedOperator;
//# sourceMappingURL=noUnspecifiedOperator.js.map