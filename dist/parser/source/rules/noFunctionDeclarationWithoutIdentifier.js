"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NoFunctionDeclarationWithoutIdentifierError = void 0;
const constants_1 = require("../../../constants");
const types_1 = require("../../../types");
class NoFunctionDeclarationWithoutIdentifierError {
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
        return `The 'function' keyword needs to be followed by a name.`;
    }
    elaborate() {
        return 'Function declarations without a name are similar to function expressions, which are banned.';
    }
}
exports.NoFunctionDeclarationWithoutIdentifierError = NoFunctionDeclarationWithoutIdentifierError;
const noFunctionDeclarationWithoutIdentifier = {
    name: 'no-function-declaration-without-identifier',
    checkers: {
        FunctionDeclaration(node, _ancestors) {
            if (node.id === null) {
                return [new NoFunctionDeclarationWithoutIdentifierError(node)];
            }
            return [];
        }
    }
};
exports.default = noFunctionDeclarationWithoutIdentifier;
//# sourceMappingURL=noFunctionDeclarationWithoutIdentifier.js.map