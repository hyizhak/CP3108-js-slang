"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NoDotAbbreviationError = void 0;
const constants_1 = require("../../../constants");
const types_1 = require("../../../types");
class NoDotAbbreviationError {
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
        return 'Dot abbreviations are not allowed.';
    }
    elaborate() {
        return `Source doesn't use object-oriented programming, so you don't need any dots in your code (except decimal \
        points in numbers).`;
    }
}
exports.NoDotAbbreviationError = NoDotAbbreviationError;
const noDotAbbreviation = {
    name: 'no-dot-abbreviation',
    disableFromChapter: types_1.Chapter.LIBRARY_PARSER,
    checkers: {
        MemberExpression(node, _ancestors) {
            if (!node.computed) {
                return [new NoDotAbbreviationError(node)];
            }
            else {
                return [];
            }
        }
    }
};
exports.default = noDotAbbreviation;
//# sourceMappingURL=noDotAbbreviation.js.map