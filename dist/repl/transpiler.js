#!/usr/bin/env node
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
const astring_1 = require("astring");
const constants_1 = require("../constants");
const gpu_1 = require("../gpu/gpu");
const index_1 = require("../index");
const lazy_1 = require("../lazy/lazy");
const parser_1 = require("../parser/parser");
const transpiler_1 = require("../transpiler/transpiler");
const types_1 = require("../types");
const validator_1 = require("../validator/validator");
function transpileCode(chapter = types_1.Chapter.SOURCE_1, variant = types_1.Variant.DEFAULT, code = '', pretranspile = false) {
    return __awaiter(this, void 0, void 0, function* () {
        // use defaults for everything
        const context = (0, index_1.createContext)(chapter, variant, undefined, undefined);
        const program = (0, parser_1.parse)(code, context);
        if (program === null) {
            throw Error((0, index_1.parseError)(context.errors, true));
        }
        (0, validator_1.validateAndAnnotate)(program, context);
        switch (variant) {
            case types_1.Variant.GPU:
                (0, gpu_1.transpileToGPU)(program);
                break;
            case types_1.Variant.LAZY:
                (0, lazy_1.transpileToLazy)(program);
                break;
        }
        if (pretranspile) {
            return (0, astring_1.generate)(program);
        }
        else {
            const { transpiled } = yield (0, transpiler_1.transpile)(program, context);
            return transpiled;
        }
    });
}
/**
 * Returns true iff the given chapter and variant combination is supported.
 */
function validChapterVariant(chapter, variant) {
    for (const lang of constants_1.sourceLanguages) {
        if (lang.chapter === chapter && lang.variant === variant)
            return true;
    }
    return false;
}
function main() {
    const opt = require('node-getopt')
        .create([
        ['c', 'chapter=CHAPTER', 'set the Source chapter number (i.e., 1-4)', '1'],
        [
            'p',
            'pretranspile',
            "only pretranspile (e.g. GPU -> Source) and don't perform Source -> JS transpilation"
        ],
        [
            'v',
            'variant=VARIANT',
            'set the Source variant (i.e., default, interpreter, substituter, lazy, non-det, concurrent, wasm, gpu)',
            'default'
        ],
        ['h', 'help', 'display this help']
    ])
        .bindHelp()
        .setHelp('Usage: js-slang-transpiler [OPTION]\n\n[[OPTIONS]]')
        .parseSystem();
    const pretranspile = opt.options.pretranspile;
    const variant = opt.options.variant;
    const chapter = parseInt(opt.options.chapter, 10);
    const valid = validChapterVariant(chapter, variant);
    if (!valid ||
        !(variant === types_1.Variant.DEFAULT || variant === types_1.Variant.LAZY || variant === types_1.Variant.GPU)) {
        throw new Error('The chapter and variant combination provided is unsupported. Use the -h option to view valid chapters and variants.');
    }
    const chunks = [];
    process.stdin.on('data', chunk => {
        chunks.push(chunk);
    });
    process.stdin.on('end', () => {
        const code = Buffer.concat(chunks).toString('utf-8');
        transpileCode(chapter, variant, code, pretranspile).then(transpiled => process.stdout.write(transpiled));
    });
}
main();
//# sourceMappingURL=transpiler.js.map