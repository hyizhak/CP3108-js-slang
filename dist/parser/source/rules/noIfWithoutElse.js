"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NoIfWithoutElseError = void 0;
const astring_1 = require("astring");
const constants_1 = require("../../../constants");
const types_1 = require("../../../types");
const formatters_1 = require("../../../utils/formatters");
class NoIfWithoutElseError {
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
        return 'Missing "else" in "if-else" statement.';
    }
    elaborate() {
        return (0, formatters_1.stripIndent) `
      This "if" block requires corresponding "else" block which will be
      evaluated when ${(0, astring_1.generate)(this.node.test)} expression evaluates to false.

      Later in the course we will lift this restriction and allow "if" without
      else.
    `;
    }
}
exports.NoIfWithoutElseError = NoIfWithoutElseError;
const noIfWithoutElse = {
    name: 'no-if-without-else',
    disableFromChapter: types_1.Chapter.SOURCE_3,
    checkers: {
        IfStatement(node, _ancestors) {
            if (!node.alternate) {
                return [new NoIfWithoutElseError(node)];
            }
            else {
                return [];
            }
        }
    }
};
exports.default = noIfWithoutElse;
//# sourceMappingURL=noIfWithoutElse.js.map