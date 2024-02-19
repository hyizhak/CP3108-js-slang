"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultBabelOptions = exports.positionToSourceLocation = exports.typedParse = exports.looseParse = exports.parseWithComments = exports.parseAt = exports.createAcornParserOptions = void 0;
const acorn_1 = require("acorn");
const acorn_loose_1 = require("acorn-loose");
const constants_1 = require("../constants");
const validator_1 = require("../validator/validator");
const errors_1 = require("./errors");
/**
 * Generates options object for acorn parser
 *
 * @param ecmaVersion ECMA version
 * @param errors error container
 * @param throwOnError throw on error if true else push to error container and resume exec
 * @param options partial acorn options
 * @returns
 */
const createAcornParserOptions = (ecmaVersion, errors, options, throwOnError) => (Object.assign({ ecmaVersion, sourceType: 'module', locations: true, onInsertedSemicolon(_tokenEndPos, tokenPos) {
        const error = new errors_1.MissingSemicolonError((0, exports.positionToSourceLocation)(tokenPos, options === null || options === void 0 ? void 0 : options.sourceFile));
        if (throwOnError)
            throw error;
        errors === null || errors === void 0 ? void 0 : errors.push(error);
    },
    onTrailingComma(_tokenEndPos, tokenPos) {
        const error = new errors_1.TrailingCommaError((0, exports.positionToSourceLocation)(tokenPos, options === null || options === void 0 ? void 0 : options.sourceFile));
        if (throwOnError)
            throw error;
        errors === null || errors === void 0 ? void 0 : errors.push(error);
    } }, options));
exports.createAcornParserOptions = createAcornParserOptions;
/**
 * Parses a single expression at a specified offset
 *
 * @param programStr program string
 * @param offset position offset
 * @param ecmaVersion ECMA version
 * @returns acorn AST Node if parse succeeds else null
 */
function parseAt(programStr, offset, ecmaVersion = constants_1.DEFAULT_ECMA_VERSION) {
    try {
        return (0, acorn_1.parseExpressionAt)(programStr, offset, { ecmaVersion });
    }
    catch (_error) {
        return null;
    }
}
exports.parseAt = parseAt;
/**
 * Parse a program, returning alongside comments found within that program
 *
 * @param programStr program string
 * @param ecmaVersion ECMA version
 * @returns tuple consisting of the parsed program, and a list of comments found within the program string
 */
function parseWithComments(programStr, ecmaVersion = constants_1.DEFAULT_ECMA_VERSION) {
    let comments = [];
    const acornOptions = (0, exports.createAcornParserOptions)(ecmaVersion, undefined, {
        onComment: comments
    }, undefined);
    let ast;
    try {
        ast = (0, acorn_1.parse)(programStr, acornOptions);
    }
    catch (_a) {
        comments = [];
        ast = (0, acorn_loose_1.parse)(programStr, acornOptions);
    }
    return [ast, comments];
}
exports.parseWithComments = parseWithComments;
/**
 * Parse program with error-tolerant acorn parser
 *
 * @param programStr program string
 * @param context js-slang context
 * @returns ast for program string
 */
function looseParse(programStr, context) {
    return (0, acorn_loose_1.parse)(programStr, (0, exports.createAcornParserOptions)(constants_1.DEFAULT_ECMA_VERSION, context.errors));
}
exports.looseParse = looseParse;
/**
 * TODO
 *
 * @param programStr program string
 * @param context js-slang context
 * @returns ast for program string
 */
function typedParse(programStr, context) {
    const ast = looseParse(programStr, context);
    return (0, validator_1.validateAndAnnotate)(ast, context);
}
exports.typedParse = typedParse;
/**
 * Converts acorn parser Position object to SourceLocation object
 *
 * @param position acorn Position object
 * @returns SourceLocation
 */
const positionToSourceLocation = (position, source) => ({
    start: Object.assign({}, position),
    end: Object.assign(Object.assign({}, position), { column: position.column + 1 }),
    source
});
exports.positionToSourceLocation = positionToSourceLocation;
exports.defaultBabelOptions = {
    sourceType: 'module',
    plugins: ['typescript', 'estree']
};
//# sourceMappingURL=utils.js.map