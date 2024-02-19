"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NoImplicitReturnUndefinedError = void 0;
const constants_1 = require("../../../constants");
const types_1 = require("../../../types");
const formatters_1 = require("../../../utils/formatters");
class NoImplicitReturnUndefinedError {
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
        return 'Missing value in return statement.';
    }
    elaborate() {
        return (0, formatters_1.stripIndent) `
      This return statement is missing a value.
      For instance, to return the value 42, you can write

        return 42;
    `;
    }
}
exports.NoImplicitReturnUndefinedError = NoImplicitReturnUndefinedError;
const noImplicitReturnUndefined = {
    name: 'no-implicit-return-undefined',
    checkers: {
        ReturnStatement(node, _ancestors) {
            if (!node.argument) {
                return [new NoImplicitReturnUndefinedError(node)];
            }
            else {
                return [];
            }
        }
    }
};
exports.default = noImplicitReturnUndefined;
//# sourceMappingURL=noImplicitReturnUndefined.js.map