"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SetPropertyError = exports.GetInheritedPropertyError = exports.GetPropertyError = exports.ConstAssignment = exports.VariableRedeclaration = exports.InvalidNumberOfArguments = exports.UnassignedVariable = exports.UndefinedVariable = exports.CallingNonFunctionValue = exports.MaximumStackLimitExceeded = exports.ExceptionError = exports.InterruptedError = void 0;
/* tslint:disable: max-classes-per-file */
/* tslint:disable:max-line-length */
const astring_1 = require("astring");
const constants_1 = require("../constants");
const types_1 = require("../types");
const stringify_1 = require("../utils/stringify");
const runtimeSourceError_1 = require("./runtimeSourceError");
class InterruptedError extends runtimeSourceError_1.RuntimeSourceError {
    constructor(node) {
        super(node);
    }
    explain() {
        return 'Execution aborted by user.';
    }
    elaborate() {
        return 'TODO';
    }
}
exports.InterruptedError = InterruptedError;
class ExceptionError {
    constructor(error, location) {
        this.error = error;
        this.type = types_1.ErrorType.RUNTIME;
        this.severity = types_1.ErrorSeverity.ERROR;
        this.location = location !== null && location !== void 0 ? location : constants_1.UNKNOWN_LOCATION;
    }
    explain() {
        return this.error.toString();
    }
    elaborate() {
        return 'TODO';
    }
}
exports.ExceptionError = ExceptionError;
class MaximumStackLimitExceeded extends runtimeSourceError_1.RuntimeSourceError {
    constructor(node, calls) {
        super(node);
        this.calls = calls;
        this.customGenerator = Object.assign(Object.assign({}, astring_1.baseGenerator), { CallExpression(node, state) {
                state.write((0, astring_1.generate)(node.callee));
                state.write('(');
                const argsRepr = node.arguments.map((arg) => (0, stringify_1.stringify)(arg.value));
                state.write(argsRepr.join(', '));
                state.write(')');
            } });
    }
    explain() {
        const repr = (call) => (0, astring_1.generate)(call, { generator: this.customGenerator });
        return ('Maximum call stack size exceeded\n  ' + this.calls.map(call => repr(call) + '..').join('  '));
    }
    elaborate() {
        return 'TODO';
    }
}
exports.MaximumStackLimitExceeded = MaximumStackLimitExceeded;
MaximumStackLimitExceeded.MAX_CALLS_TO_SHOW = 3;
class CallingNonFunctionValue extends runtimeSourceError_1.RuntimeSourceError {
    constructor(callee, node) {
        super(node);
        this.callee = callee;
        this.node = node;
    }
    explain() {
        return `Calling non-function value ${(0, stringify_1.stringify)(this.callee)}.`;
    }
    elaborate() {
        const calleeVal = this.callee;
        const calleeStr = (0, stringify_1.stringify)(calleeVal);
        let argStr = '';
        const callArgs = this.node.arguments;
        argStr = callArgs.map(astring_1.generate).join(', ');
        const elabStr = `Because ${calleeStr} is not a function, you cannot run ${calleeStr}(${argStr}).`;
        const multStr = `If you were planning to perform multiplication by ${calleeStr}, you need to use the * operator.`;
        if (Number.isFinite(calleeVal)) {
            return `${elabStr} ${multStr}`;
        }
        else {
            return elabStr;
        }
    }
}
exports.CallingNonFunctionValue = CallingNonFunctionValue;
class UndefinedVariable extends runtimeSourceError_1.RuntimeSourceError {
    constructor(name, node) {
        super(node);
        this.name = name;
    }
    explain() {
        return `Name ${this.name} not declared.`;
    }
    elaborate() {
        return `Before you can read the value of ${this.name}, you need to declare it as a variable or a constant. You can do this using the let or const keywords.`;
    }
}
exports.UndefinedVariable = UndefinedVariable;
class UnassignedVariable extends runtimeSourceError_1.RuntimeSourceError {
    constructor(name, node) {
        super(node);
        this.name = name;
    }
    explain() {
        return `Name ${this.name} declared later in current scope but not yet assigned`;
    }
    elaborate() {
        return `If you're trying to access the value of ${this.name} from an outer scope, please rename the inner ${this.name}. An easy way to avoid this issue in future would be to avoid declaring any variables or constants with the name ${this.name} in the same scope.`;
    }
}
exports.UnassignedVariable = UnassignedVariable;
class InvalidNumberOfArguments extends runtimeSourceError_1.RuntimeSourceError {
    constructor(node, expected, got, hasVarArgs = false) {
        super(node);
        this.expected = expected;
        this.got = got;
        this.hasVarArgs = hasVarArgs;
        this.calleeStr = (0, astring_1.generate)(node.callee);
    }
    explain() {
        return `Expected ${this.expected} ${this.hasVarArgs ? 'or more ' : ''}arguments, but got ${this.got}.`;
    }
    elaborate() {
        const calleeStr = this.calleeStr;
        const pluralS = this.expected === 1 ? '' : 's';
        return `Try calling function ${calleeStr} again, but with ${this.expected} argument${pluralS} instead. Remember that arguments are separated by a ',' (comma).`;
    }
}
exports.InvalidNumberOfArguments = InvalidNumberOfArguments;
class VariableRedeclaration extends runtimeSourceError_1.RuntimeSourceError {
    constructor(node, name, writable) {
        super(node);
        this.node = node;
        this.name = name;
        this.writable = writable;
    }
    explain() {
        return `Redeclaring name ${this.name}.`;
    }
    elaborate() {
        if (this.writable === true) {
            const elabStr = `Since ${this.name} has already been declared, you can assign a value to it without re-declaring.`;
            let initStr = '';
            if (this.node.type === 'FunctionDeclaration') {
                initStr =
                    '(' + this.node.params.map(astring_1.generate).join(',') + ') => {...';
            }
            else if (this.node.type === 'VariableDeclaration') {
                initStr = (0, astring_1.generate)(this.node.declarations[0].init);
            }
            return `${elabStr} As such, you can just do\n\n\t${this.name} = ${initStr};\n`;
        }
        else if (this.writable === false) {
            return `You will need to declare another variable, as ${this.name} is read-only.`;
        }
        else {
            return '';
        }
    }
}
exports.VariableRedeclaration = VariableRedeclaration;
class ConstAssignment extends runtimeSourceError_1.RuntimeSourceError {
    constructor(node, name) {
        super(node);
        this.name = name;
    }
    explain() {
        return `Cannot assign new value to constant ${this.name}.`;
    }
    elaborate() {
        return `As ${this.name} was declared as a constant, its value cannot be changed. You will have to declare a new variable.`;
    }
}
exports.ConstAssignment = ConstAssignment;
class GetPropertyError extends runtimeSourceError_1.RuntimeSourceError {
    constructor(node, obj, prop) {
        super(node);
        this.obj = obj;
        this.prop = prop;
    }
    explain() {
        return `Cannot read property ${this.prop} of ${(0, stringify_1.stringify)(this.obj)}.`;
    }
    elaborate() {
        return 'TODO';
    }
}
exports.GetPropertyError = GetPropertyError;
class GetInheritedPropertyError extends runtimeSourceError_1.RuntimeSourceError {
    constructor(node, obj, prop) {
        var _a;
        super(node);
        this.obj = obj;
        this.prop = prop;
        this.type = types_1.ErrorType.RUNTIME;
        this.severity = types_1.ErrorSeverity.ERROR;
        this.location = (_a = node.loc) !== null && _a !== void 0 ? _a : constants_1.UNKNOWN_LOCATION;
    }
    explain() {
        return `Cannot read inherited property ${this.prop} of ${(0, stringify_1.stringify)(this.obj)}.`;
    }
    elaborate() {
        return 'TODO';
    }
}
exports.GetInheritedPropertyError = GetInheritedPropertyError;
class SetPropertyError extends runtimeSourceError_1.RuntimeSourceError {
    constructor(node, obj, prop) {
        super(node);
        this.obj = obj;
        this.prop = prop;
    }
    explain() {
        return `Cannot assign property ${this.prop} of ${(0, stringify_1.stringify)(this.obj)}.`;
    }
    elaborate() {
        return 'TODO';
    }
}
exports.SetPropertyError = SetPropertyError;
//# sourceMappingURL=errors.js.map