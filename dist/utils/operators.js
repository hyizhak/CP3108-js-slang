"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProp = exports.setProp = exports.wrapSourceModule = exports.wrap = exports.callIteratively = exports.evaluateBinaryExpression = exports.binaryOp = exports.evaluateUnaryExpression = exports.unaryOp = exports.boolOrErr = exports.callIfFuncAndRightArgs = exports.makeLazyFunction = exports.wrapLazyCallee = exports.delayIt = exports.forceIt = exports.throwIfTimeout = void 0;
const createContext_1 = require("../createContext");
const errors_1 = require("../errors/errors");
const runtimeSourceError_1 = require("../errors/runtimeSourceError");
const timeoutErrors_1 = require("../errors/timeoutErrors");
const astCreator_1 = require("./astCreator");
const create = require("./astCreator");
const makeWrapper_1 = require("./makeWrapper");
const rttc = require("./rttc");
function throwIfTimeout(nativeStorage, start, current, line, column, source) {
    if (current - start > nativeStorage.maxExecTime) {
        throw new timeoutErrors_1.PotentialInfiniteLoopError(create.locationDummyNode(line, column, source), nativeStorage.maxExecTime);
    }
}
exports.throwIfTimeout = throwIfTimeout;
function forceIt(val) {
    if (val !== undefined && val !== null && val.isMemoized !== undefined) {
        if (val.isMemoized) {
            return val.memoizedValue;
        }
        const evaluatedValue = forceIt(val.f());
        val.isMemoized = true;
        val.memoizedValue = evaluatedValue;
        return evaluatedValue;
    }
    else {
        return val;
    }
}
exports.forceIt = forceIt;
function delayIt(f) {
    return {
        isMemoized: false,
        value: undefined,
        f
    };
}
exports.delayIt = delayIt;
function wrapLazyCallee(candidate) {
    candidate = forceIt(candidate);
    if (typeof candidate === 'function') {
        const wrapped = (...args) => candidate(...args.map(forceIt));
        (0, makeWrapper_1.makeWrapper)(candidate, wrapped);
        wrapped[Symbol.toStringTag] = () => candidate.toString();
        wrapped.toString = () => candidate.toString();
        return wrapped;
    }
    else if (candidate instanceof createContext_1.LazyBuiltIn) {
        if (candidate.evaluateArgs) {
            const wrapped = (...args) => candidate.func(...args.map(forceIt));
            (0, makeWrapper_1.makeWrapper)(candidate.func, wrapped);
            wrapped[Symbol.toStringTag] = () => candidate.toString();
            wrapped.toString = () => candidate.toString();
            return wrapped;
        }
        else {
            return candidate;
        }
    }
    // doesn't look like a function, not our business to error now
    return candidate;
}
exports.wrapLazyCallee = wrapLazyCallee;
function makeLazyFunction(candidate) {
    return new createContext_1.LazyBuiltIn(candidate, false);
}
exports.makeLazyFunction = makeLazyFunction;
function callIfFuncAndRightArgs(candidate, line, column, source, ...args) {
    const dummy = create.callExpression(create.locationDummyNode(line, column, source), args, {
        start: { line, column },
        end: { line, column }
    });
    if (typeof candidate === 'function') {
        const originalCandidate = candidate;
        if (candidate.transformedFunction !== undefined) {
            candidate = candidate.transformedFunction;
        }
        const expectedLength = candidate.length;
        const receivedLength = args.length;
        const hasVarArgs = candidate.minArgsNeeded !== undefined;
        if (hasVarArgs ? candidate.minArgsNeeded > receivedLength : expectedLength !== receivedLength) {
            throw new errors_1.InvalidNumberOfArguments(dummy, hasVarArgs ? candidate.minArgsNeeded : expectedLength, receivedLength, hasVarArgs);
        }
        try {
            const forcedArgs = args.map(forceIt);
            return originalCandidate(...forcedArgs);
        }
        catch (error) {
            // if we already handled the error, simply pass it on
            if (!(error instanceof runtimeSourceError_1.RuntimeSourceError || error instanceof errors_1.ExceptionError)) {
                throw new errors_1.ExceptionError(error, dummy.loc);
            }
            else {
                throw error;
            }
        }
    }
    else if (candidate instanceof createContext_1.LazyBuiltIn) {
        try {
            if (candidate.evaluateArgs) {
                args = args.map(forceIt);
            }
            return candidate.func(...args);
        }
        catch (error) {
            // if we already handled the error, simply pass it on
            if (!(error instanceof runtimeSourceError_1.RuntimeSourceError || error instanceof errors_1.ExceptionError)) {
                throw new errors_1.ExceptionError(error, dummy.loc);
            }
            else {
                throw error;
            }
        }
    }
    else {
        throw new errors_1.CallingNonFunctionValue(candidate, dummy);
    }
}
exports.callIfFuncAndRightArgs = callIfFuncAndRightArgs;
function boolOrErr(candidate, line, column, source) {
    candidate = forceIt(candidate);
    const error = rttc.checkIfStatement(create.locationDummyNode(line, column, source), candidate);
    if (error === undefined) {
        return candidate;
    }
    else {
        throw error;
    }
}
exports.boolOrErr = boolOrErr;
function unaryOp(operator, argument, line, column, source) {
    argument = forceIt(argument);
    const error = rttc.checkUnaryExpression(create.locationDummyNode(line, column, source), operator, argument);
    if (error === undefined) {
        return evaluateUnaryExpression(operator, argument);
    }
    else {
        throw error;
    }
}
exports.unaryOp = unaryOp;
function evaluateUnaryExpression(operator, value) {
    if (operator === '!') {
        return !value;
    }
    else if (operator === '-') {
        return -value;
    }
    else if (operator === 'typeof') {
        return typeof value;
    }
    else {
        return +value;
    }
}
exports.evaluateUnaryExpression = evaluateUnaryExpression;
function binaryOp(operator, chapter, left, right, line, column, source) {
    left = forceIt(left);
    right = forceIt(right);
    const error = rttc.checkBinaryExpression(create.locationDummyNode(line, column, source), operator, chapter, left, right);
    if (error === undefined) {
        return evaluateBinaryExpression(operator, left, right);
    }
    else {
        throw error;
    }
}
exports.binaryOp = binaryOp;
function evaluateBinaryExpression(operator, left, right) {
    switch (operator) {
        case '+':
            return left + right;
        case '-':
            return left - right;
        case '*':
            return left * right;
        case '/':
            return left / right;
        case '%':
            return left % right;
        case '===':
            return left === right;
        case '!==':
            return left !== right;
        case '<=':
            return left <= right;
        case '<':
            return left < right;
        case '>':
            return left > right;
        case '>=':
            return left >= right;
        default:
            return undefined;
    }
}
exports.evaluateBinaryExpression = evaluateBinaryExpression;
/**
 * Limitations for current properTailCalls implementation:
 * Obviously, if objects ({}) are reintroduced,
 * we have to change this for a more stringent check,
 * as isTail and transformedFunctions are properties
 * and may be added by Source code.
 */
const callIteratively = (f, nativeStorage, ...args) => {
    let line = -1;
    let column = -1;
    let source = null;
    const startTime = Date.now();
    const pastCalls = [];
    while (true) {
        const dummy = (0, astCreator_1.locationDummyNode)(line, column, source);
        f = forceIt(f);
        if (typeof f === 'function') {
            if (f.transformedFunction !== undefined) {
                f = f.transformedFunction;
            }
            const expectedLength = f.length;
            const receivedLength = args.length;
            const hasVarArgs = f.minArgsNeeded !== undefined;
            if (hasVarArgs ? f.minArgsNeeded > receivedLength : expectedLength !== receivedLength) {
                throw new errors_1.InvalidNumberOfArguments((0, astCreator_1.callExpression)(dummy, args, {
                    start: { line, column },
                    end: { line, column },
                    source
                }), hasVarArgs ? f.minArgsNeeded : expectedLength, receivedLength, hasVarArgs);
            }
        }
        else if (f instanceof createContext_1.LazyBuiltIn) {
            if (f.evaluateArgs) {
                args = args.map(forceIt);
            }
            f = f.func;
        }
        else {
            throw new errors_1.CallingNonFunctionValue(f, dummy);
        }
        let res;
        try {
            res = f(...args);
            if (Date.now() - startTime > nativeStorage.maxExecTime) {
                throw new timeoutErrors_1.PotentialInfiniteRecursionError(dummy, pastCalls, nativeStorage.maxExecTime);
            }
        }
        catch (error) {
            // if we already handled the error, simply pass it on
            if (!(error instanceof runtimeSourceError_1.RuntimeSourceError || error instanceof errors_1.ExceptionError)) {
                throw new errors_1.ExceptionError(error, dummy.loc);
            }
            else {
                throw error;
            }
        }
        if (res === null || res === undefined) {
            return res;
        }
        else if (res.isTail === true) {
            f = res.function;
            args = res.arguments;
            line = res.line;
            column = res.column;
            source = res.source;
            pastCalls.push([res.functionName, args]);
        }
        else if (res.isTail === false) {
            return res.value;
        }
        else {
            return res;
        }
    }
};
exports.callIteratively = callIteratively;
const wrap = (f, stringified, hasVarArgs, nativeStorage) => {
    if (hasVarArgs) {
        // @ts-ignore
        f.minArgsNeeded = f.length;
    }
    const wrapped = (...args) => (0, exports.callIteratively)(f, nativeStorage, ...args);
    (0, makeWrapper_1.makeWrapper)(f, wrapped);
    wrapped.transformedFunction = f;
    wrapped[Symbol.toStringTag] = () => stringified;
    wrapped.toString = () => stringified;
    return wrapped;
};
exports.wrap = wrap;
const wrapSourceModule = (moduleName, moduleFunc, requireProvider) => Object.entries(moduleFunc(requireProvider)).reduce((res, [name, value]) => {
    if (typeof value === 'function') {
        const repr = `function ${name} {\n\t[Function from ${moduleName}\n\tImplementation hidden]\n}`;
        value[Symbol.toStringTag] = () => repr;
        value.toString = () => repr;
    }
    return Object.assign(Object.assign({}, res), { [name]: value });
}, {});
exports.wrapSourceModule = wrapSourceModule;
const setProp = (obj, prop, value, line, column, source) => {
    const dummy = (0, astCreator_1.locationDummyNode)(line, column, source);
    const error = rttc.checkMemberAccess(dummy, obj, prop);
    if (error === undefined) {
        return (obj[prop] = value);
    }
    else {
        throw error;
    }
};
exports.setProp = setProp;
const getProp = (obj, prop, line, column, source) => {
    const dummy = (0, astCreator_1.locationDummyNode)(line, column, source);
    const error = rttc.checkMemberAccess(dummy, obj, prop);
    if (error === undefined) {
        if (obj[prop] !== undefined && !obj.hasOwnProperty(prop)) {
            throw new errors_1.GetInheritedPropertyError(dummy, obj, prop);
        }
        else {
            return obj[prop];
        }
    }
    else {
        throw error;
    }
};
exports.getProp = getProp;
//# sourceMappingURL=operators.js.map