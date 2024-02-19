"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getInfiniteLoopData = exports.InfiniteLoopError = exports.InfiniteLoopErrorType = exports.isPotentialInfiniteLoop = exports.StackOverflowMessages = void 0;
const errors_1 = require("../errors/errors");
const runtimeSourceError_1 = require("../errors/runtimeSourceError");
const timeoutErrors_1 = require("../errors/timeoutErrors");
const instrument_1 = require("./instrument");
var StackOverflowMessages;
(function (StackOverflowMessages) {
    StackOverflowMessages["firefox"] = "InternalError: too much recursion";
    // webkit: chrome + safari. Also works for node
    StackOverflowMessages["webkit"] = "RangeError: Maximum call stack size exceeded";
    StackOverflowMessages["edge"] = "Error: Out of stack space";
})(StackOverflowMessages = exports.StackOverflowMessages || (exports.StackOverflowMessages = {}));
/**
 * Checks if the error is a TimeoutError or Stack Overflow.
 *
 * @returns {true} if the error is a TimeoutError or Stack Overflow.
 * @returns {false} otherwise.
 */
function isPotentialInfiniteLoop(error) {
    if (error instanceof timeoutErrors_1.TimeoutError) {
        return true;
    }
    else if (error instanceof errors_1.ExceptionError) {
        const message = error.explain();
        for (const toMatch of Object.values(StackOverflowMessages)) {
            if (message.includes(toMatch)) {
                return true;
            }
        }
    }
    return false;
}
exports.isPotentialInfiniteLoop = isPotentialInfiniteLoop;
var InfiniteLoopErrorType;
(function (InfiniteLoopErrorType) {
    InfiniteLoopErrorType[InfiniteLoopErrorType["NoBaseCase"] = 0] = "NoBaseCase";
    InfiniteLoopErrorType[InfiniteLoopErrorType["Cycle"] = 1] = "Cycle";
    InfiniteLoopErrorType[InfiniteLoopErrorType["FromSmt"] = 2] = "FromSmt";
})(InfiniteLoopErrorType = exports.InfiniteLoopErrorType || (exports.InfiniteLoopErrorType = {}));
class InfiniteLoopError extends runtimeSourceError_1.RuntimeSourceError {
    constructor(functionName, streamMode, message, infiniteLoopType) {
        super();
        this.message = message;
        this.infiniteLoopType = infiniteLoopType;
        this.functionName = functionName;
        this.streamMode = streamMode;
    }
    explain() {
        const entityName = this.functionName ? `function ${(0, instrument_1.getOriginalName)(this.functionName)}` : 'loop';
        return this.streamMode
            ? `The error may have arisen from forcing the infinite stream: ${entityName}.`
            : `The ${entityName} has encountered an infinite loop. ` + this.message;
    }
}
exports.InfiniteLoopError = InfiniteLoopError;
/**
 * Determines whether the error is an infinite loop, and returns a tuple of
 * [error type, is stream, error message, previous code].
 *  *
 * @param {Context} - The context being used.
 *
 * @returns [error type, is stream, error message, previous programs] if the error was an infinite loop
 * @returns {undefined} otherwise
 */
function getInfiniteLoopData(context) {
    // return error type/string, prevCodeStack
    // cast as any to access infiniteLoopError property later
    const errors = context.errors;
    let latestError = errors[errors.length - 1];
    if (latestError instanceof errors_1.ExceptionError) {
        latestError = latestError.error;
    }
    let infiniteLoopError;
    if (latestError instanceof InfiniteLoopError) {
        infiniteLoopError = latestError;
    }
    else if (latestError.hasOwnProperty('infiniteLoopError')) {
        infiniteLoopError = latestError.infiniteLoopError;
    }
    if (infiniteLoopError) {
        return [
            infiniteLoopError.infiniteLoopType,
            infiniteLoopError.streamMode,
            infiniteLoopError.explain(),
            context.previousPrograms
        ];
    }
    else {
        return undefined;
    }
}
exports.getInfiniteLoopData = getInfiniteLoopData;
//# sourceMappingURL=errors.js.map