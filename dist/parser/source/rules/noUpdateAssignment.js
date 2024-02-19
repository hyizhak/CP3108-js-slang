"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NoUpdateAssignment = void 0;
const astring_1 = require("astring");
const constants_1 = require("../../../constants");
const types_1 = require("../../../types");
class NoUpdateAssignment {
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
        return 'The assignment operator ' + this.node.operator + ' is not allowed. Use = instead.';
    }
    elaborate() {
        const leftStr = (0, astring_1.generate)(this.node.left);
        const rightStr = (0, astring_1.generate)(this.node.right);
        const newOpStr = this.node.operator.slice(0, -1);
        if (newOpStr === '+' || newOpStr === '-' || newOpStr === '/' || newOpStr === '*') {
            const elabStr = `\n\t${leftStr} = ${leftStr} ${newOpStr} ${rightStr};`;
            return elabStr;
        }
        else {
            return '';
        }
    }
}
exports.NoUpdateAssignment = NoUpdateAssignment;
const noUpdateAssignment = {
    name: 'no-update-assignment',
    checkers: {
        AssignmentExpression(node, _ancestors) {
            if (node.operator !== '=') {
                return [new NoUpdateAssignment(node)];
            }
            else {
                return [];
            }
        }
    }
};
exports.default = noUpdateAssignment;
//# sourceMappingURL=noUpdateAssignment.js.map