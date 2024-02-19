"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NoTemplateExpressionError = void 0;
const constants_1 = require("../../../constants");
const types_1 = require("../../../types");
class NoTemplateExpressionError {
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
        return 'Expressions are not allowed in template literals (`multiline strings`)';
    }
    elaborate() {
        return this.explain();
    }
}
exports.NoTemplateExpressionError = NoTemplateExpressionError;
const noTemplateExpression = {
    name: 'no-template-expression',
    checkers: {
        TemplateLiteral(node, _ancestors) {
            if (node.expressions.length > 0) {
                return [new NoTemplateExpressionError(node)];
            }
            else {
                return [];
            }
        }
    }
};
exports.default = noTemplateExpression;
//# sourceMappingURL=noTemplateExpression.js.map