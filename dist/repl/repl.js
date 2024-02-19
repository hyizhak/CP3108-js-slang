#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const repl_1 = require("repl"); // 'repl' here refers to the module named 'repl' in index.d.ts
const util_1 = require("util");
const constants_1 = require("../constants");
const index_1 = require("../index");
const closure_1 = require("../interpreter/closure");
const types_1 = require("../types");
function startRepl(chapter = 1, executionMethod = 'interpreter', variant = types_1.Variant.DEFAULT, useSubst = false, useRepl, prelude = '') {
    // use defaults for everything
    const context = (0, index_1.createContext)(chapter, variant, undefined, undefined);
    const options = {
        scheduler: 'preemptive',
        executionMethod,
        variant,
        useSubst
    };
    (0, index_1.runInContext)(prelude, context, options).then(preludeResult => {
        if (preludeResult.status === 'finished' || preludeResult.status === 'suspended-non-det') {
            console.dir(preludeResult.value, { depth: null });
            if (!useRepl) {
                return;
            }
            (0, repl_1.start)(
            // the object being passed as argument fits the interface ReplOptions in the repl module.
            {
                eval: (cmd, unusedContext, unusedFilename, callback) => {
                    (0, index_1.runInContext)(cmd, context, options).then(obj => {
                        if (obj.status === 'finished' || obj.status === 'suspended-non-det') {
                            callback(null, obj.value);
                        }
                        else {
                            callback(new Error((0, index_1.parseError)(context.errors)), undefined);
                        }
                    });
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
            console.error((0, index_1.parseError)(context.errors));
        }
    });
}
/**
 * Returns true iff the given chapter and variant combination is supported.
 */
function validChapterVariant(chapter, variant) {
    if (variant === 'interpreter') {
        return true;
    }
    // TODO explicit control should only be done with source chapter 4
    if (variant === 'explicit-control') {
        return true;
    }
    if (variant === 'substituter' && (chapter === 1 || chapter === 2)) {
        return true;
    }
    for (const lang of constants_1.sourceLanguages) {
        if (lang.chapter === chapter && lang.variant === variant)
            return true;
    }
    for (const lang of constants_1.scmLanguages) {
        if (lang.chapter === chapter && lang.variant === variant)
            return true;
    }
    for (const lang of constants_1.pyLanguages) {
        if (lang.chapter === chapter && lang.variant === variant)
            return true;
    }
    return false;
}
function main() {
    var _a;
    const opt = require('node-getopt')
        .create([
        ['c', 'chapter=CHAPTER', 'set the Source chapter number (i.e., 1-4)', '1'],
        [
            'v',
            'variant=VARIANT',
            'set the Source variant (i.e., default, interpreter, substituter, lazy, non-det, concurrent, wasm, gpu)',
            'default'
        ],
        ['h', 'help', 'display this help'],
        ['e', 'eval', "don't show REPL, only display output of evaluation"]
    ])
        .bindHelp()
        .setHelp('Usage: js-slang [PROGRAM_STRING] [OPTION]\n\n[[OPTIONS]]')
        .parseSystem();
    const variant = opt.options.variant;
    const chapter = parseInt(opt.options.chapter, 10);
    const areValidChapterVariant = validChapterVariant(chapter, variant);
    if (!areValidChapterVariant) {
        throw new Error('The chapter and variant combination provided is unsupported. Use the -h option to view valid chapters and variants.');
    }
    const executionMethod = opt.options.variant === 'interpreter' ||
        opt.options.variant === 'non-det' ||
        opt.options.variant === 'explicit-control'
        ? 'interpreter'
        : 'native';
    const useSubst = opt.options.variant === 'substituter';
    const useRepl = !opt.options.e;
    const prelude = (_a = opt.argv[0]) !== null && _a !== void 0 ? _a : '';
    startRepl(chapter, executionMethod, variant, useSubst, useRepl, prelude);
}
main();
//# sourceMappingURL=repl.js.map