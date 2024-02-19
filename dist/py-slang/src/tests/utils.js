"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toEstreeAstAndResolve = exports.toEstreeAST = exports.toPythonAstAndResolve = exports.toPythonAst = void 0;
const tokenizer_1 = require("../tokenizer");
const parser_1 = require("../parser");
const resolver_1 = require("../resolver");
const translator_1 = require("../translator");
function toPythonAst(text) {
    const script = text + '\n';
    const tokenizer = new tokenizer_1.Tokenizer(script);
    const tokens = tokenizer.scanEverything();
    const pyParser = new parser_1.Parser(script, tokens);
    const ast = pyParser.parse();
    // console.dir(ast);
    return ast;
}
exports.toPythonAst = toPythonAst;
function toPythonAstAndResolve(text) {
    const ast = toPythonAst(text);
    new resolver_1.Resolver(text, ast).resolve(ast);
    return ast;
}
exports.toPythonAstAndResolve = toPythonAstAndResolve;
function toEstreeAST(text) {
    const ast = toPythonAst(text);
    return new translator_1.Translator(text).resolve(ast);
}
exports.toEstreeAST = toEstreeAST;
function toEstreeAstAndResolve(text) {
    const ast = toPythonAst(text);
    return new translator_1.Translator(text).resolve(ast);
}
exports.toEstreeAstAndResolve = toEstreeAstAndResolve;
//# sourceMappingURL=utils.js.map