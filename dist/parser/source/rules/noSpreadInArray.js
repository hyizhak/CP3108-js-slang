"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NoSpreadInArray = void 0;
const constants_1 = require("../../../constants");
const types_1 = require("../../../types");
class NoSpreadInArray {
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
        return 'Spread syntax is not allowed in arrays.';
    }
    elaborate() {
        return '';
    }
}
exports.NoSpreadInArray = NoSpreadInArray;
const noSpreadInArray = {
    name: 'no-assignment-expression',
    checkers: {
        SpreadElement(node, ancestors) {
            const parent = ancestors[ancestors.length - 2];
            if (parent.type === 'CallExpression') {
                return [];
            }
            else {
                return [new NoSpreadInArray(node)];
            }
        }
    }
};
exports.default = noSpreadInArray;
//# sourceMappingURL=noSpreadInArray.js.map