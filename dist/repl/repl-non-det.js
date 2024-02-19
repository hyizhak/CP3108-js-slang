"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const repl = require("repl"); // 'repl' here refers to the module named 'repl' in index.d.ts
const util_1 = require("util");
const constants_1 = require("../constants");
const index_1 = require("../index");
const closure_1 = require("../interpreter/closure");
const types_1 = require("../types");
const NO_MORE_VALUES_MESSAGE = 'There are no more values of: ';
let previousInput; // stores the input which is then shown when there are no more values for the program
let previousResult; // stores the result obtained when execution is suspended
function _handleResult(result, context, callback) {
    if (result.status === 'finished' || result.status === 'suspended-non-det') {
        previousResult = result;
        if (result.value === constants_1.CUT)
            result.value = undefined;
        callback(null, result.value);
    }
    else {
        const error = new Error((0, index_1.parseError)(context.errors));
        // we do not display the stack trace, because the stack trace points to code within this REPL
        // program, rather than the erroneous line in the user's program. Such a trace is too low level
        // to be helpful.
        error.stack = undefined;
        callback(error, undefined);
        return;
    }
}
function _try_again_message() {
    if (previousInput) {
        const message = NO_MORE_VALUES_MESSAGE + previousInput;
        previousInput = undefined;
        return message;
    }
    else {
        return undefined;
    }
}
function _resume(toResume, context, callback) {
    Promise.resolve((0, index_1.resume)(toResume)).then((result) => {
        if (result.status === 'finished')
            result.value = _try_again_message();
        _handleResult(result, context, callback);
    });
}
function _try_again(context, callback) {
    if (previousResult && previousResult.status === 'suspended-non-det') {
        _resume(previousResult, context, callback);
    }
    else {
        callback(null, _try_again_message());
    }
}
function _run(cmd, context, options, callback) {
    if (cmd.trim() === constants_1.TRY_AGAIN) {
        _try_again(context, callback);
    }
    else {
        previousInput = cmd.trim();
        (0, index_1.runInContext)(cmd, context, options).then(result => {
            _handleResult(result, context, callback);
        });
    }
}
function _startRepl(chapter = types_1.Chapter.SOURCE_1, useSubst, prelude = '') {
    // use defaults for everything
    const context = (0, index_1.createContext)(chapter, types_1.Variant.NON_DET);
    const options = {
        executionMethod: 'interpreter',
        useSubst
    };
    (0, index_1.runInContext)(prelude, context, options).then(preludeResult => {
        if (preludeResult.status === 'finished' || preludeResult.status === 'suspended-non-det') {
            console.dir(preludeResult.value, { depth: null });
            repl.start(
            // the object being passed as argument fits the interface ReplOptions in the repl module.
            {
                eval: (cmd, unusedContext, unusedFilename, callback) => {
                    _run(cmd, context, options, callback);
                },
                // set depth to a large number so that `parse()` output will not be folded,
                // setting to null also solves the problem, however a reference loop might crash
                writer: output => {
                    return output instanceof closure_1.default || typeof output === 'function'
                        ? output.toString()
                        : (0, util_1.inspect)(output, {
                            depth: 1000,
                            colors: true
                        });
                }
            });
        }
        else {
            throw new Error((0, index_1.parseError)(context.errors));
        }
    });
}
function main() {
    const firstArg = process.argv[2];
    if (process.argv.length === 3 && String(Number(firstArg)) !== firstArg.trim()) {
        fs.readFile(firstArg, 'utf8', (err, data) => {
            if (err) {
                throw err;
            }
            _startRepl(types_1.Chapter.SOURCE_3, false, data);
        });
    }
    else {
        const chapter = types_1.Chapter.SOURCE_3;
        const useSubst = process.argv.length > 3 ? process.argv[3] === 'subst' : false;
        _startRepl(chapter, useSubst);
    }
}
main();
//# sourceMappingURL=repl-non-det.js.map