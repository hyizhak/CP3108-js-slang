"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NoUnspecifiedLiteral = void 0;
const constants_1 = require("../../../constants");
const types_1 = require("../../../types");
const specifiedLiterals = ['boolean', 'string', 'number'];
class NoUnspecifiedLiteral {
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
        /**
         * A check is used for RegExp to ensure that only RegExp are caught.
         * Any other unspecified literal value should not be caught.
         */
        const literal = this.node.value instanceof RegExp ? 'RegExp' : '';
        return `'${literal}' literals are not allowed.`;
    }
    elaborate() {
        return '';
    }
}
exports.NoUnspecifiedLiteral = NoUnspecifiedLiteral;
const noUnspecifiedLiteral = {
    name: 'no-unspecified-literal',
    checkers: {
        Literal(node, _ancestors) {
            if (node.value !== null && !specifiedLiterals.includes(typeof node.value)) {
                return [new NoUnspecifiedLiteral(node)];
            }
            else {
                return [];
            }
        }
    }
};
exports.default = noUnspecifiedLiteral;
//# sourceMappingURL=noUnspecifiedLiteral.js.map