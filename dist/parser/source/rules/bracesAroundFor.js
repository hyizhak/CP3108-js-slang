"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BracesAroundForError = void 0;
const astring_1 = require("astring");
const constants_1 = require("../../../constants");
const types_1 = require("../../../types");
class BracesAroundForError {
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
        return 'Missing curly braces around "for" block.';
    }
    elaborate() {
        const initStr = (0, astring_1.generate)(this.node.init);
        const testStr = (0, astring_1.generate)(this.node.test);
        const updateStr = (0, astring_1.generate)(this.node.update);
        const forStr = `\tfor (${initStr} ${testStr}; ${updateStr}) {\n\t\t//code goes here\n\t}`;
        return `Remember to enclose your "for" block with braces:\n\n ${forStr}`;
    }
}
exports.BracesAroundForError = BracesAroundForError;
const bracesAroundFor = {
    name: 'braces-around-for',
    checkers: {
        ForStatement(node, _ancestors) {
            if (node.body.type !== 'BlockStatement') {
                return [new BracesAroundForError(node)];
            }
            else {
                return [];
            }
        }
    }
};
exports.default = bracesAroundFor;
//# sourceMappingURL=bracesAroundFor.js.map