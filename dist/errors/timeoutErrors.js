"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PotentialInfiniteRecursionError = exports.PotentialInfiniteLoopError = exports.TimeoutError = void 0;
const constants_1 = require("../constants");
const types_1 = require("../types");
const formatters_1 = require("../utils/formatters");
const stringify_1 = require("../utils/stringify");
const runtimeSourceError_1 = require("./runtimeSourceError");
function getWarningMessage(maxExecTime) {
    const from = maxExecTime / 1000;
    const to = from * constants_1.JSSLANG_PROPERTIES.factorToIncreaseBy;
    return (0, formatters_1.stripIndent) `If you are certain your program is correct, press run again without editing your program.
      The time limit will be increased from ${from} to ${to} seconds.
      This page may be unresponsive for up to ${to} seconds if you do so.`;
}
class TimeoutError extends runtimeSourceError_1.RuntimeSourceError {
}
exports.TimeoutError = TimeoutError;
class PotentialInfiniteLoopError extends TimeoutError {
    constructor(node, maxExecTime) {
        super(node);
        this.maxExecTime = maxExecTime;
        this.type = types_1.ErrorType.RUNTIME;
        this.severity = types_1.ErrorSeverity.ERROR;
    }
    explain() {
        return (0, formatters_1.stripIndent) `${'Potential infinite loop detected'}.
    ${getWarningMessage(this.maxExecTime)}`;
    }
    elaborate() {
        return this.explain();
    }
}
exports.PotentialInfiniteLoopError = PotentialInfiniteLoopError;
class PotentialInfiniteRecursionError extends TimeoutError {
    constructor(node, calls, maxExecTime) {
        super(node);
        this.calls = calls;
        this.maxExecTime = maxExecTime;
        this.type = types_1.ErrorType.RUNTIME;
        this.severity = types_1.ErrorSeverity.ERROR;
        this.calls = this.calls.slice(-3);
    }
    explain() {
        const formattedCalls = this.calls.map(([executedName, executedArguments]) => `${executedName}(${executedArguments.map(arg => (0, stringify_1.stringify)(arg)).join(', ')})`);
        return (0, formatters_1.stripIndent) `${'Potential infinite recursion detected'}: ${formattedCalls.join(' ... ')}.
      ${getWarningMessage(this.maxExecTime)}`;
    }
    elaborate() {
        return this.explain();
    }
}
exports.PotentialInfiniteRecursionError = PotentialInfiniteRecursionError;
//# sourceMappingURL=timeoutErrors.js.map