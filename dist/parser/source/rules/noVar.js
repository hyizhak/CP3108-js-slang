"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NoVarError = void 0;
const astring_1 = require("astring");
const constants_1 = require("../../../constants");
const types_1 = require("../../../types");
class NoVarError {
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
        return 'Variable declaration using "var" is not allowed.';
    }
    elaborate() {
        const name = this.node.declarations[0].id.name;
        const value = (0, astring_1.generate)(this.node.declarations[0].init);
        return `Use keyword "let" instead, to declare a variable:\n\n\tlet ${name} = ${value};`;
    }
}
exports.NoVarError = NoVarError;
const noVar = {
    name: 'no-var',
    checkers: {
        VariableDeclaration(node, _ancestors) {
            if (node.kind === 'var') {
                return [new NoVarError(node)];
            }
            else {
                return [];
            }
        }
    }
};
exports.default = noVar;
//# sourceMappingURL=noVar.js.map