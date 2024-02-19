"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BracesAroundIfElseError = void 0;
const astring_1 = require("astring");
const constants_1 = require("../../../constants");
const types_1 = require("../../../types");
const formatters_1 = require("../../../utils/formatters");
class BracesAroundIfElseError {
    constructor(node, branch) {
        this.node = node;
        this.branch = branch;
        this.type = types_1.ErrorType.SYNTAX;
        this.severity = types_1.ErrorSeverity.ERROR;
    }
    get location() {
        var _a;
        return (_a = this.node.loc) !== null && _a !== void 0 ? _a : constants_1.UNKNOWN_LOCATION;
    }
    explain() {
        if (this.branch === 'consequent') {
            return 'Missing curly braces around "if" block.';
        }
        else {
            return 'Missing curly braces around "else" block.';
        }
    }
    elaborate() {
        let ifOrElse;
        let header;
        let body;
        if (this.branch === 'consequent') {
            ifOrElse = 'if';
            header = `if (${(0, astring_1.generate)(this.node.test)})`;
            body = this.node.consequent;
        }
        else {
            ifOrElse = header = 'else';
            body = this.node.alternate;
        }
        return (0, formatters_1.stripIndent) `
      ${ifOrElse} block need to be enclosed with a pair of curly braces.

      ${header} {
        ${(0, astring_1.generate)(body)}
      }

      An exception is when you have an "if" followed by "else if", in this case
      "else if" block does not need to be surrounded by curly braces.

      if (someCondition) {
        // ...
      } else /* notice missing { here */ if (someCondition) {
        // ...
      } else {
        // ...
      }

      Rationale: Readability in dense packed code.

      In the snippet below, for instance, with poor indentation it is easy to
      mistaken hello() and world() to belong to the same branch of logic.

      if (someCondition) {
        2;
      } else
        hello();
      world();

    `;
    }
}
exports.BracesAroundIfElseError = BracesAroundIfElseError;
const bracesAroundIfElse = {
    name: 'braces-around-if-else',
    checkers: {
        IfStatement(node, _ancestors) {
            const errors = [];
            if (node.consequent && node.consequent.type !== 'BlockStatement') {
                errors.push(new BracesAroundIfElseError(node, 'consequent'));
            }
            if (node.alternate) {
                const notBlock = node.alternate.type !== 'BlockStatement';
                const notIf = node.alternate.type !== 'IfStatement';
                if (notBlock && notIf) {
                    errors.push(new BracesAroundIfElseError(node, 'alternate'));
                }
            }
            return errors;
        }
    }
};
exports.default = bracesAroundIfElse;
//# sourceMappingURL=bracesAroundIfElse.js.map