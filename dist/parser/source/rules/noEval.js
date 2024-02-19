"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NoEval = void 0;
const constants_1 = require("../../../constants");
const types_1 = require("../../../types");
class NoEval {
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
        return `eval is not allowed.`;
    }
    elaborate() {
        return this.explain();
    }
}
exports.NoEval = NoEval;
const noEval = {
    name: 'no-eval',
    checkers: {
        Identifier(node, _ancestors) {
            if (node.name === 'eval') {
                return [new NoEval(node)];
            }
            else {
                return [];
            }
        }
    }
};
exports.default = noEval;
//# sourceMappingURL=noEval.js.map