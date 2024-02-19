"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DisallowedConstructError = exports.FatalSyntaxError = exports.TrailingCommaError = exports.MissingSemicolonError = void 0;
const constants_1 = require("../constants");
const types_1 = require("../types");
const formatters_1 = require("../utils/formatters");
class MissingSemicolonError {
    constructor(location) {
        this.location = location;
        this.type = types_1.ErrorType.SYNTAX;
        this.severity = types_1.ErrorSeverity.ERROR;
    }
    explain() {
        return 'Missing semicolon at the end of statement';
    }
    elaborate() {
        return 'Every statement must be terminated by a semicolon.';
    }
}
exports.MissingSemicolonError = MissingSemicolonError;
class TrailingCommaError {
    constructor(location) {
        this.location = location;
    }
    explain() {
        return 'Trailing comma';
    }
    elaborate() {
        return 'Please remove the trailing comma';
    }
}
exports.TrailingCommaError = TrailingCommaError;
class FatalSyntaxError {
    constructor(location, message) {
        this.location = location;
        this.message = message;
        this.type = types_1.ErrorType.SYNTAX;
        this.severity = types_1.ErrorSeverity.ERROR;
    }
    explain() {
        return this.message;
    }
    elaborate() {
        return 'There is a syntax error in your program';
    }
}
exports.FatalSyntaxError = FatalSyntaxError;
class DisallowedConstructError {
    constructor(node) {
        this.node = node;
        this.type = types_1.ErrorType.SYNTAX;
        this.severity = types_1.ErrorSeverity.ERROR;
        this.nodeType = this.formatNodeType(this.node.type);
    }
    get location() {
        var _a;
        return (_a = this.node.loc) !== null && _a !== void 0 ? _a : constants_1.UNKNOWN_LOCATION;
    }
    explain() {
        return `${this.nodeType} are not allowed`;
    }
    elaborate() {
        return (0, formatters_1.stripIndent) `
        You are trying to use ${this.nodeType}, which is not allowed (yet).
      `;
    }
    /**
     * Converts estree node.type into english
     * e.g. ThisExpression -> 'this' expressions
     *      Property -> Properties
     *      EmptyStatement -> Empty Statements
     */
    formatNodeType(nodeType) {
        switch (nodeType) {
            case 'ThisExpression':
                return "'this' expressions";
            case 'Property':
                return 'Properties';
            case 'ImportNamespaceSpecifier':
                return 'Namespace imports';
            default: {
                const words = nodeType.split(/(?=[A-Z])/);
                return words.map((word, i) => (i === 0 ? word : word.toLowerCase())).join(' ') + 's';
            }
        }
    }
}
exports.DisallowedConstructError = DisallowedConstructError;
//# sourceMappingURL=errors.js.map