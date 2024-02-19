"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.decodeError = exports.decodeValue = exports.encodeTree = exports.SchemeParser = void 0;
const src_1 = require("../../scm-slang/src");
const source_scheme_library_1 = require("../../scm-slang/src/stdlib/source-scheme-library");
const types_1 = require("../../types");
const errors_1 = require("../errors");
const utils_1 = require("../utils");
const walk = require('acorn-walk');
class SchemeParser {
    constructor(chapter) {
        this.chapter = getSchemeChapter(chapter);
    }
    parse(programStr, context, options, throwOnError) {
        try {
            // parse the scheme code
            const estree = (0, src_1.schemeParse)(programStr, this.chapter);
            // walk the estree and encode all identifiers
            encodeTree(estree);
            return estree;
        }
        catch (error) {
            if (error instanceof SyntaxError) {
                error = new errors_1.FatalSyntaxError((0, utils_1.positionToSourceLocation)(error.loc), error.toString());
            }
            if (throwOnError)
                throw error;
            context.errors.push(error);
        }
        return null;
    }
    validate(_ast, _context, _throwOnError) {
        return true;
    }
    toString() {
        return `SchemeParser{chapter: ${this.chapter}}`;
    }
}
exports.SchemeParser = SchemeParser;
function getSchemeChapter(chapter) {
    switch (chapter) {
        case types_1.Chapter.SCHEME_1:
            return 1;
        case types_1.Chapter.SCHEME_2:
            return 2;
        case types_1.Chapter.SCHEME_3:
            return 3;
        case types_1.Chapter.SCHEME_4:
            return 4;
        case types_1.Chapter.FULL_SCHEME:
            return Infinity;
        default:
            // Should never happen
            throw new Error(`SchemeParser was not given a valid chapter!`);
    }
}
function encodeTree(tree) {
    walk.full(tree, (node) => {
        if (node.type === 'Identifier') {
            node.name = (0, src_1.encode)(node.name);
        }
    });
    return tree;
}
exports.encodeTree = encodeTree;
function decodeString(str) {
    return str.replace(/\$scheme_[\w$]+|\$\d+\$/g, match => {
        return (0, src_1.decode)(match);
    });
}
// Given any value, decode it if and
// only if an encoded value may exist in it.
function decodeValue(x) {
    // In future: add support for decoding vectors.
    if (x instanceof source_scheme_library_1.Pair) {
        // May contain encoded strings.
        return new source_scheme_library_1.Pair(decodeValue(x.car), decodeValue(x.cdr));
    }
    else if (x instanceof Array) {
        // May contain encoded strings.
        return x.map(decodeValue);
    }
    else if (x instanceof Function) {
        const newString = decodeString(x.toString());
        x.toString = () => newString;
        return x;
    }
    else {
        // string, number, boolean, null, undefined
        // no need to decode.
        return x;
    }
}
exports.decodeValue = decodeValue;
// Given an error, decode its message if and
// only if an encoded value may exist in it.
function decodeError(error) {
    if (error.type === types_1.ErrorType.SYNTAX) {
        // Syntax errors are not encoded.
        return error;
    }
    const newExplain = decodeString(error.explain());
    const newElaborate = decodeString(error.elaborate());
    return Object.assign(Object.assign({}, error), { explain: () => newExplain, elaborate: () => newElaborate });
}
exports.decodeError = decodeError;
//# sourceMappingURL=index.js.map