"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.testForInfiniteLoop = void 0;
const constants_1 = require("../constants");
const createContext_1 = require("../createContext");
const requireProvider_1 = require("../modules/requireProvider");
const parser_1 = require("../parser/parser");
const stdList = require("../stdlib/list");
const types_1 = require("../types");
const create = require("../utils/astCreator");
const detect_1 = require("./detect");
const errors_1 = require("./errors");
const instrument_1 = require("./instrument");
const st = require("./state");
const sym = require("./symbolic");
function checkTimeout(state) {
    if (state.hasTimedOut()) {
        throw new Error('timeout');
    }
}
/**
 * This function is run whenever a variable is being accessed.
 * If a variable has been added to state.variablesToReset, it will
 * be 'reset' (concretized and re-hybridized) here.
 */
function hybridize(originalValue, name, state) {
    if (typeof originalValue === 'function') {
        return originalValue;
    }
    let value = originalValue;
    if (state.variablesToReset.has(name)) {
        value = sym.deepConcretizeInplace(value);
    }
    return sym.hybridizeNamed(name, value);
}
/**
 * Function to keep track of assignment expressions.
 */
function saveVarIfHybrid(value, name, state) {
    state.variablesToReset.delete(name);
    if (sym.isHybrid(value)) {
        state.variablesModified.set(name, value);
    }
    return value;
}
/**
 * Saves the boolean value if it is a hybrid, else set the
 * path to invalid.
 * Does not save in the path if the value is a boolean literal.
 */
function saveBoolIfHybrid(value, state) {
    if (sym.isHybrid(value) && value.type === 'value') {
        if (value.validity !== sym.Validity.Valid) {
            state.setInvalidPath();
            return sym.shallowConcretize(value);
        }
        if (value.symbolic.type !== 'Literal') {
            let theExpr = value.symbolic;
            if (!value.concrete) {
                theExpr = value.negation ? value.negation : create.unaryExpression('!', theExpr);
            }
            state.savePath(theExpr);
        }
        return sym.shallowConcretize(value);
    }
    else {
        state.setInvalidPath();
        return value;
    }
}
/**
 * If a function was passed as an argument we do not
 * check it for infinite loops. Wraps those functions
 * with a decorator that activates a flag in the state.
 */
function wrapArgIfFunction(arg, state) {
    if (typeof arg === 'function') {
        return (...args) => {
            state.functionWasPassedAsArgument = true;
            return arg(...args);
        };
    }
    return arg;
}
/**
 * For higher-order functions, we add the names of its parameters
 * that are functions to differentiate different combinations of
 * function invocations + parameters.
 *
 * e.g.
 * const f = x=>x;
 * const g = x=>x+1;
 * const h = f=>f(1);
 *
 * h(f) will have a different oracle name from h(g).
 */
function makeOracleName(name, args) {
    let result = name;
    for (const [n, v] of args) {
        if (typeof v === 'function') {
            result = `${result}_${n}:${v.name}`;
        }
    }
    return result;
}
function preFunction(name, args, state) {
    checkTimeout(state);
    // track functions which were passed as arguments in a different tracker
    const newName = state.functionWasPassedAsArgument ? '*' + name : makeOracleName(name, args);
    const [tracker, firstIteration] = state.enterFunction(newName);
    if (!firstIteration) {
        state.cleanUpVariables();
        state.saveArgsInTransition(args, tracker);
        if (!state.functionWasPassedAsArgument) {
            const previousIterations = tracker.slice(0, tracker.length - 1);
            checkForInfiniteLoopIfMeetsThreshold(previousIterations, state, name);
        }
    }
    tracker.push(state.newStackFrame(newName));
    // reset the flag
    state.functionWasPassedAsArgument = false;
}
function returnFunction(value, state) {
    state.cleanUpVariables();
    if (!state.streamMode)
        state.returnLastFunction();
    return value;
}
/**
 * Executed before the loop is entered to create a new iteration
 * tracker.
 */
function enterLoop(state) {
    state.loopStack.unshift([state.newStackFrame('loopRoot')]);
}
// ignoreMe: hack to squeeze this inside the 'update' of for statements
function postLoop(state, ignoreMe) {
    checkTimeout(state);
    const previousIterations = state.loopStack[0];
    checkForInfiniteLoopIfMeetsThreshold(previousIterations.slice(0, previousIterations.length - 1), state);
    state.cleanUpVariables();
    previousIterations.push(state.newStackFrame('loop'));
    return ignoreMe;
}
/**
 * Always executed after a loop terminates, or breaks, to clean up
 * variables and pop the last iteration tracker.
 */
function exitLoop(state) {
    state.cleanUpVariables();
    state.exitLoop();
}
/**
 * If the number of iterations (given by the length
 * of stackPositions) is equal to a power of 2 times
 * the threshold, check these iterations for infinite loop.
 */
function checkForInfiniteLoopIfMeetsThreshold(stackPositions, state, functionName) {
    let checkpoint = state.threshold;
    while (checkpoint <= stackPositions.length) {
        if (stackPositions.length === checkpoint) {
            (0, detect_1.checkForInfiniteLoop)(stackPositions, state, functionName);
        }
        checkpoint = checkpoint * 2;
    }
}
/**
 * Test if stream is infinite. May destructively change the program
 * environment. If it is not infinite, throw a timeout error.
 */
function testIfInfiniteStream(stream, state) {
    let next = stream;
    for (let i = 0; i <= state.threshold; i++) {
        if (stdList.is_null(next)) {
            break;
        }
        else {
            const nextTail = stdList.is_pair(next) ? next[1] : undefined;
            if (typeof nextTail === 'function') {
                next = sym.shallowConcretize(nextTail());
            }
            else {
                break;
            }
        }
    }
    throw new Error('timeout');
}
const builtinSpecialCases = {
    is_null(maybeHybrid, state) {
        const xs = sym.shallowConcretize(maybeHybrid);
        const conc = stdList.is_null(xs);
        const theTail = stdList.is_pair(xs) ? xs[1] : undefined;
        const isStream = typeof theTail === 'function';
        if (state && isStream) {
            const lastFunction = state.getLastFunctionName();
            if (state.streamMode === true && state.streamLastFunction === lastFunction) {
                // heuristic to make sure we are at the same is_null call
                testIfInfiniteStream(sym.shallowConcretize(theTail()), state);
            }
            else {
                let count = state.streamCounts.get(lastFunction);
                if (count === undefined) {
                    count = 1;
                }
                if (count > state.streamThreshold) {
                    state.streamMode = true;
                    state.streamLastFunction = lastFunction;
                }
                state.streamCounts.set(lastFunction, count + 1);
            }
        }
        else {
            return conc;
        }
        return;
    },
    // mimic behaviour without printing
    display: (...x) => x[0],
    display_list: (...x) => x[0]
};
function returnInvalidIfNumeric(val, validity = sym.Validity.NoSmt) {
    if (typeof val === 'number') {
        const result = sym.makeDummyHybrid(val);
        result.validity = validity;
        return result;
    }
    else {
        return val;
    }
}
function prepareBuiltins(oldBuiltins) {
    const nonDetFunctions = ['get_time', 'math_random'];
    const newBuiltins = new Map();
    for (const [name, fun] of oldBuiltins) {
        const specialCase = builtinSpecialCases[name];
        if (specialCase !== undefined) {
            newBuiltins.set(name, specialCase);
        }
        else {
            const functionValidity = nonDetFunctions.includes(name)
                ? sym.Validity.NoCycle
                : sym.Validity.NoSmt;
            newBuiltins.set(name, (...args) => {
                const validityOfArgs = args.filter(sym.isHybrid).map(x => x.validity);
                const mostInvalid = Math.max(functionValidity, ...validityOfArgs);
                return returnInvalidIfNumeric(fun(...args.map(sym.shallowConcretize)), mostInvalid);
            });
        }
    }
    newBuiltins.set('undefined', undefined);
    return newBuiltins;
}
function nothingFunction(..._args) {
    return nothingFunction;
}
function trackLoc(loc, state, ignoreMe) {
    state.lastLocation = loc;
    if (ignoreMe !== undefined) {
        return ignoreMe();
    }
}
const functions = {};
functions[instrument_1.InfiniteLoopRuntimeFunctions.nothingFunction] = nothingFunction;
functions[instrument_1.InfiniteLoopRuntimeFunctions.concretize] = sym.shallowConcretize;
functions[instrument_1.InfiniteLoopRuntimeFunctions.hybridize] = hybridize;
functions[instrument_1.InfiniteLoopRuntimeFunctions.wrapArg] = wrapArgIfFunction;
functions[instrument_1.InfiniteLoopRuntimeFunctions.dummify] = sym.makeDummyHybrid;
functions[instrument_1.InfiniteLoopRuntimeFunctions.saveBool] = saveBoolIfHybrid;
functions[instrument_1.InfiniteLoopRuntimeFunctions.saveVar] = saveVarIfHybrid;
functions[instrument_1.InfiniteLoopRuntimeFunctions.preFunction] = preFunction;
functions[instrument_1.InfiniteLoopRuntimeFunctions.returnFunction] = returnFunction;
functions[instrument_1.InfiniteLoopRuntimeFunctions.postLoop] = postLoop;
functions[instrument_1.InfiniteLoopRuntimeFunctions.enterLoop] = enterLoop;
functions[instrument_1.InfiniteLoopRuntimeFunctions.exitLoop] = exitLoop;
functions[instrument_1.InfiniteLoopRuntimeFunctions.trackLoc] = trackLoc;
functions[instrument_1.InfiniteLoopRuntimeFunctions.evalB] = sym.evaluateHybridBinary;
functions[instrument_1.InfiniteLoopRuntimeFunctions.evalU] = sym.evaluateHybridUnary;
/**
 * Tests the given program for infinite loops.
 * @param program Program to test.
 * @param previousProgramsStack Any code previously entered in the REPL & parsed into AST.
 * @returns SourceError if an infinite loop was detected, undefined otherwise.
 */
function testForInfiniteLoop(program, previousProgramsStack) {
    return __awaiter(this, void 0, void 0, function* () {
        const context = (0, createContext_1.default)(types_1.Chapter.SOURCE_4, types_1.Variant.DEFAULT, undefined, undefined);
        const prelude = (0, parser_1.parse)(context.prelude, context);
        context.prelude = null;
        const previous = [...previousProgramsStack, prelude];
        const newBuiltins = prepareBuiltins(context.nativeStorage.builtins);
        const { builtinsId, functionsId, stateId } = instrument_1.InfiniteLoopRuntimeObjectNames;
        const instrumentedCode = yield (0, instrument_1.instrument)(previous, program, newBuiltins.keys());
        const state = new st.State();
        const sandboxedRun = new Function('code', functionsId, stateId, builtinsId, constants_1.REQUIRE_PROVIDER_ID, 
        // redeclare window so modules don't do anything funny like play sounds
        '{let window = {}; return eval(code)}');
        try {
            yield sandboxedRun(instrumentedCode, functions, state, newBuiltins, (0, requireProvider_1.getRequireProvider)(context));
        }
        catch (error) {
            if (error instanceof errors_1.InfiniteLoopError) {
                if (state.lastLocation !== undefined) {
                    error.location = state.lastLocation;
                }
                return error;
            }
            // Programs that exceed the maximum call stack size are okay as long as they terminate.
            if (error instanceof RangeError && error.message === 'Maximum call stack size exceeded') {
                return undefined;
            }
            throw error;
        }
        return undefined;
    });
}
exports.testForInfiniteLoop = testForInfiniteLoop;
//# sourceMappingURL=runtime.js.map