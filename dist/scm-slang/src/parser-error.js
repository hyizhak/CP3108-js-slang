"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UnsupportedTokenError = exports.DisallowedTokenError = exports.ExpectedTokenError = exports.UnexpectedTokenError = exports.UnexpectedEOFError = exports.ParenthesisMismatchError = exports.GenericSyntaxError = exports.ParserError = void 0;
function extractLine(source, pos) {
    let lines = source.split("\n");
    return lines[pos.line - 1];
}
function showPoint(pos) {
    return "^".padStart(pos.column, " ");
}
class ParserError extends SyntaxError {
    constructor(message, pos) {
        super(`Syntax error at (${pos.line}:${pos.column})\n${message}`);
        this.loc = pos;
    }
    toString() {
        return this.message;
    }
}
exports.ParserError = ParserError;
class GenericSyntaxError extends ParserError {
    constructor(source, pos) {
        super(extractLine(source, pos) + "\n" + showPoint(pos), pos);
        this.name = "GenericSyntaxError";
    }
}
exports.GenericSyntaxError = GenericSyntaxError;
class ParenthesisMismatchError extends ParserError {
    constructor(source, pos) {
        super(extractLine(source, pos) +
            "\n" +
            showPoint(pos) +
            "\n" +
            "Mismatched parenthesis", pos);
        this.name = "ParenthesisMismatchError";
    }
}
exports.ParenthesisMismatchError = ParenthesisMismatchError;
class UnexpectedEOFError extends ParserError {
    constructor(source, pos) {
        super(extractLine(source, pos) + "\n" + "Unexpected EOF", pos);
        this.name = "UnexpectedEOFError";
    }
}
exports.UnexpectedEOFError = UnexpectedEOFError;
class UnexpectedTokenError extends ParserError {
    constructor(source, pos, token) {
        super(extractLine(source, pos) +
            "\n" +
            showPoint(pos) +
            "\n" +
            `Unexpected \'${token}\'`, pos);
        this.token = token;
        this.name = "UnexpectedTokenError";
    }
}
exports.UnexpectedTokenError = UnexpectedTokenError;
class ExpectedTokenError extends ParserError {
    constructor(source, pos, token, expected) {
        super(extractLine(source, pos) +
            "\n" +
            showPoint(pos) +
            "\n" +
            `Expected \'${expected}\' but got \'${token}\'`, pos);
        this.token = token;
        this.expected = expected;
        this.name = "ExpectedTokenError";
    }
}
exports.ExpectedTokenError = ExpectedTokenError;
class DisallowedTokenError extends ParserError {
    constructor(source, pos, token, chapter) {
        super(extractLine(source, pos) +
            "\n" +
            showPoint(pos) +
            "\n" +
            `Syntax \'${token}\' not allowed at Scheme \xa7${chapter}`, pos);
        this.token = token;
        this.name = "DisallowedTokenError";
    }
}
exports.DisallowedTokenError = DisallowedTokenError;
class UnsupportedTokenError extends ParserError {
    constructor(source, pos, token) {
        super(extractLine(source, pos) +
            "\n" +
            showPoint(pos) +
            "\n" +
            `Syntax \'${token}\' not supported yet`, pos);
        this.token = token;
        this.name = "UnsupportedTokenError";
    }
}
exports.UnsupportedTokenError = UnsupportedTokenError;
//# sourceMappingURL=parser-error.js.map