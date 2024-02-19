"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UnexpectedEOFError = exports.UnexpectedCharacterError = exports.TokenizerError = void 0;
class TokenizerError extends SyntaxError {
    constructor(message, line, col) {
        super(message);
        this.loc = {
            line: line,
            column: col,
        };
    }
    toString() {
        return this.message;
    }
}
exports.TokenizerError = TokenizerError;
class UnexpectedCharacterError extends TokenizerError {
    constructor(line, col, char) {
        super(`Unexpected character \'${char}\' (${line}:${col})`, line, col);
        this.char = char;
        this.name = "UnexpectedCharacterError";
    }
}
exports.UnexpectedCharacterError = UnexpectedCharacterError;
class UnexpectedEOFError extends TokenizerError {
    constructor(line, col) {
        super(`Unexpected EOF (${line}:${col})`, line, col);
        this.name = "UnexpectedEOFError";
    }
}
exports.UnexpectedEOFError = UnexpectedEOFError;
//# sourceMappingURL=tokenizer-error.js.map