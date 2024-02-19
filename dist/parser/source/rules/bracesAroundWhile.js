"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BracesAroundWhileError = void 0;
const astring_1 = require("astring");
const constants_1 = require("../../../constants");
const types_1 = require("../../../types");
class BracesAroundWhileError {
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
        return 'Missing curly braces around "while" block.';
    }
    elaborate() {
        const testStr = (0, astring_1.generate)(this.node.test);
        const whileStr = `\twhile (${testStr}) {\n\t\t//code goes here\n\t}`;
        return `Remember to enclose your "while" block with braces:\n\n ${whileStr}`;
    }
}
exports.BracesAroundWhileError = BracesAroundWhileError;
const bracesAroundWhile = {
    name: 'braces-around-while',
    checkers: {
        WhileStatement(node, _ancestors) {
            if (node.body.type !== 'BlockStatement') {
                return [new BracesAroundWhileError(node)];
            }
            else {
                return [];
            }
        }
    }
};
exports.default = bracesAroundWhile;
//# sourceMappingURL=bracesAroundWhile.js.map