"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolvedErrorPromise = exports.hasVerboseErrors = exports.determineExecutionMethod = exports.determineVariant = void 0;
const utils_1 = require("../parser/utils");
const inspector_1 = require("../stdlib/inspector");
const walkers_1 = require("../utils/walkers");
// Context Utils
/**
 * Small function to determine the variant to be used
 * by a program, as both context and options can have
 * a variant. The variant provided in options will
 * have precedence over the variant provided in context.
 *
 * @param context The context of the program.
 * @param options Options to be used when
 *                running the program.
 *
 * @returns The variant that the program is to be run in
 */
function determineVariant(context, options) {
    if (options.variant) {
        return options.variant;
    }
    else {
        return context.variant;
    }
}
exports.determineVariant = determineVariant;
function determineExecutionMethod(theOptions, context, program, verboseErrors) {
    if (theOptions.executionMethod !== 'auto') {
        context.executionMethod = theOptions.executionMethod;
        return;
    }
    if (context.executionMethod !== 'auto') {
        return;
    }
    let isNativeRunnable;
    if (verboseErrors) {
        isNativeRunnable = false;
    }
    else if ((0, inspector_1.areBreakpointsSet)()) {
        isNativeRunnable = false;
    }
    else if (theOptions.executionMethod === 'auto') {
        if (context.executionMethod === 'auto') {
            if (verboseErrors) {
                isNativeRunnable = false;
            }
            else if ((0, inspector_1.areBreakpointsSet)()) {
                isNativeRunnable = false;
            }
            else {
                let hasDebuggerStatement = false;
                (0, walkers_1.simple)(program, {
                    DebuggerStatement(node) {
                        hasDebuggerStatement = true;
                    }
                });
                isNativeRunnable = !hasDebuggerStatement;
            }
            context.executionMethod = isNativeRunnable ? 'native' : 'ec-evaluator';
        }
        else {
            isNativeRunnable = context.executionMethod === 'native';
        }
    }
    else {
        let hasDebuggerStatement = false;
        (0, walkers_1.simple)(program, {
            DebuggerStatement(_node) {
                hasDebuggerStatement = true;
            }
        });
        isNativeRunnable = !hasDebuggerStatement;
    }
    context.executionMethod = isNativeRunnable ? 'native' : 'ec-evaluator';
}
exports.determineExecutionMethod = determineExecutionMethod;
// AST Utils
function hasVerboseErrors(theCode) {
    const theProgramFirstExpression = (0, utils_1.parseAt)(theCode, 0);
    if (theProgramFirstExpression && theProgramFirstExpression.type === 'Literal') {
        return theProgramFirstExpression.value === 'enable verbose';
    }
    return false;
}
exports.hasVerboseErrors = hasVerboseErrors;
exports.resolvedErrorPromise = Promise.resolve({ status: 'error' });
//# sourceMappingURL=utils.js.map