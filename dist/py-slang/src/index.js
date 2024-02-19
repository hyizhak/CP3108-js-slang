"use strict";
//
// // // Forbidden identifier
// // text =
// // `
// // async def y():
// //     pass
// // `;
// //
// // Non four indent
// // let text =
// // `
// // def x():
// //    pass
// // `;
//
// // // Unrecognised token
// // text = `
// //             ?
// // `;
//
// // Unterminated string
// // text = `\
// //
// // "abc" "abcdef`;
//
// // // Forbidden operator
// // text =`
// // a @= b
// // `
//
// // // Expected token
// // text = `
// // def a(c, d)
// //     pass
// // `
//
// // // Expected else block
// // text = `
// // if y:
// //     pass
// //
// // `;
//
// // // Expected colon after lambda:
// // text = `
// // x = lambda a
// // `;
//
// // // Expected import
// // text = `
// // from x
// // `;
//
// // // Bad identifier
// // text = `
// // def a(1, 2):
// //     pass
// // `;
//
// // // Missing closing parentheses:
// // text = `
// // def a(a, b:
// //     pass
// // `;
//
// // // @TODO Invalid assign target
// // text = `
// //
// // 1 = 2 def a(b, c):
// //     pass
// // `;
//
// // Variable declaration hoisting
// // text = `
// // x = 1
// // def a():
// //     if True:
// //         x = 1
// //     else:
// //         y = 2
// //     def b():
// //         x = 1
// // `
// // // Undeclared variable
// // text = `
// // x = display(a)
// // `
// // Misspelled name
// // text = `
// // displar(1)
// // `
//
// // // Mispelled name 2
//
// // text = `
// // def y(param):
// //     def z():
// //         var = display(barams)
// // `
//
// // // Name reassignment
//
// // text = `
// // x = 1
// // while True:
// //     pass
// // x = lambda a:a
// // `;
//
// // text = `
// // # !x
// // not x
// // `
//
// // text = `
// // (lambda a:a)(1)
// //
// // `;
//
// // text = `
// // (x)(1)
// // `;
//
// // text = `
// // def a(b,c):
// //     pass
// // `;
//
/* Use as a command line script */
/* npm run start:dev -- test.py */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.parsePythonToEstreeAst = void 0;
const tokenizer_1 = require("./tokenizer");
const parser_1 = require("./parser");
const translator_1 = require("./translator");
const resolver_1 = require("./resolver");
function parsePythonToEstreeAst(code, variant = 1, doValidate = true) {
    const script = code + '\n';
    const tokenizer = new tokenizer_1.Tokenizer(script);
    const tokens = tokenizer.scanEverything();
    const pyParser = new parser_1.Parser(script, tokens);
    const ast = pyParser.parse();
    // TODO: have a function to block commands based on the version.
    if (doValidate) {
        new resolver_1.Resolver(script, ast).resolve(ast);
    }
    const translator = new translator_1.Translator(script);
    return translator.resolve(ast);
}
exports.parsePythonToEstreeAst = parsePythonToEstreeAst;
__exportStar(require("./errors"), exports);
const errors_1 = require("./errors");
const fs_1 = require("fs");
const BaseParserError = errors_1.ParserErrors.BaseParserError;
const BaseTokenizerError = errors_1.TokenizerErrors.BaseTokenizerError;
const BaseResolverError = errors_1.ResolverErrors.BaseResolverError;
if (process.argv.length > 2) {
    try {
        let text = fs_1.default.readFileSync(process.argv[2], 'utf8');
        // Add a new line just in case
        text += '\n';
        const tokenizer = new tokenizer_1.Tokenizer(text);
        const tokens = tokenizer.scanEverything();
        tokenizer.printTokens();
        const parser = new parser_1.Parser(text, tokens);
        const ast = parser.parse();
        const resolver = new resolver_1.Resolver(text, ast);
        resolver.resolve(ast);
        console.dir(ast, { depth: null });
        const translator = new translator_1.Translator(text);
        const estreeAst = translator.resolve(ast);
        console.dir(estreeAst, { depth: null });
    }
    catch (e) {
        if (e instanceof BaseTokenizerError
            || e instanceof BaseParserError
            || e instanceof BaseResolverError) {
            console.error(e.message);
        }
        else {
            throw e;
        }
    }
}
//# sourceMappingURL=index.js.map