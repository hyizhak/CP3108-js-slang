"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NoDeclareMutableError = void 0;
const astring_1 = require("astring");
const constants_1 = require("../../../constants");
const types_1 = require("../../../types");
const mutableDeclarators = ['let', 'var'];
class NoDeclareMutableError {
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
        return ('Mutable variable declaration using keyword ' + `'${this.node.kind}'` + ' is not allowed.');
    }
    elaborate() {
        const name = this.node.declarations[0].id.name;
        const value = (0, astring_1.generate)(this.node.declarations[0].init);
        return `Use keyword "const" instead, to declare a constant:\n\n\tconst ${name} = ${value};`;
    }
}
exports.NoDeclareMutableError = NoDeclareMutableError;
const noDeclareMutable = {
    name: 'no-declare-mutable',
    disableFromChapter: types_1.Chapter.SOURCE_3,
    checkers: {
        VariableDeclaration(node, _ancestors) {
            if (mutableDeclarators.includes(node.kind)) {
                return [new NoDeclareMutableError(node)];
            }
            else {
                return [];
            }
        }
    }
};
exports.default = noDeclareMutable;
//# sourceMappingURL=noDeclareMutable.js.map