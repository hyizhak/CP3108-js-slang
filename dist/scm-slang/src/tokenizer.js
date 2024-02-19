"use strict";
// Thanks to Ken Jin (py-slang) for the great resource https://craftinginterpreters.com/scanning.html
// This tokenizer is a modified version, inspired by both the
// tokenizer above as well as Ken Jin's py-slang tokenizer.
// It has been adapted to be written in typescript for scheme.
// Crafting Interpreters: https://craftinginterpreters.com/
// py-slang: https://github.com/source-academy/py-slang
Object.defineProperty(exports, "__esModule", { value: true });
exports.Tokenizer = exports.Token = void 0;
const token_type_1 = require("./token-type");
const TokenizerError = require("./tokenizer-error");
// syntactic keywords in the scheme language
let keywords = new Map([
    [".", token_type_1.TokenType.DOT],
    ["if", token_type_1.TokenType.IF],
    ["let", token_type_1.TokenType.LET],
    ["cond", token_type_1.TokenType.COND],
    ["else", token_type_1.TokenType.ELSE],
    ["set!", token_type_1.TokenType.SET],
    ["begin", token_type_1.TokenType.BEGIN],
    ["delay", token_type_1.TokenType.DELAY],
    ["quote", token_type_1.TokenType.QUOTE],
    ["export", token_type_1.TokenType.EXPORT],
    ["import", token_type_1.TokenType.IMPORT],
    ["define", token_type_1.TokenType.DEFINE],
    ["lambda", token_type_1.TokenType.LAMBDA],
]);
class Token {
    constructor(type, lexeme, literal, start, end, line, col) {
        this.type = type;
        this.lexeme = lexeme;
        this.literal = literal;
        this.start = start;
        this.end = end;
        this.pos = {
            line: line,
            column: col,
        };
    }
    toString() {
        return `${this.lexeme}`;
    }
}
exports.Token = Token;
class Tokenizer {
    constructor(source) {
        this.start = 0;
        this.current = 0;
        this.line = 1;
        this.col = 0;
        this.source = source;
        this.tokens = [];
    }
    isAtEnd() {
        return this.current >= this.source.length;
    }
    advance() {
        // get the next character
        this.col++;
        return this.source.charAt(this.current++);
    }
    jump() {
        // when you want to ignore a character
        this.start = this.current;
        this.col++;
        this.current++;
    }
    addToken(type, literal = null) {
        const text = this.source.substring(this.start, this.current);
        this.tokens.push(new Token(type, text, literal, this.start, this.current, this.line, this.col));
    }
    scanTokens() {
        while (!this.isAtEnd()) {
            this.start = this.current;
            this.scanToken();
        }
        this.tokens.push(new Token(token_type_1.TokenType.EOF, "", null, this.start, this.current, this.line, this.col));
        return this.tokens;
    }
    scanToken() {
        const c = this.advance();
        switch (c) {
            case "(":
                this.addToken(token_type_1.TokenType.LEFT_PAREN);
                break;
            case ")":
                this.addToken(token_type_1.TokenType.RIGHT_PAREN);
                break;
            case "[":
                this.addToken(token_type_1.TokenType.LEFT_BRACKET);
                break;
            case "]":
                this.addToken(token_type_1.TokenType.RIGHT_BRACKET);
                break;
            case "'":
                this.addToken(token_type_1.TokenType.APOSTROPHE);
                break;
            case "`":
                this.addToken(token_type_1.TokenType.BACKTICK);
                break;
            case ",":
                this.addToken(token_type_1.TokenType.COMMA);
                break;
            case "#":
                if (this.match("t") || this.match("f")) {
                    this.booleanToken();
                }
                else if (this.match("|")) {
                    // a multiline comment
                    this.comment();
                }
                else {
                    this.addToken(token_type_1.TokenType.HASH);
                }
                break;
            case ";":
                // a comment
                while (this.peek() != "\n" && !this.isAtEnd())
                    this.advance();
                break;
            // double character tokens not currently needed
            case " ":
            case "\r":
            case "\t":
                // ignore whitespace
                break;
            case "\n":
                this.line++;
                this.col = 0;
                break;
            case '"':
                this.stringToken();
                break;
            case "|":
                this.identifierTokenLoose();
                break;
            default:
                // Deviates slightly from the original tokenizer.
                // Scheme allows for identifiers to start with a digit
                // or include a specific set of symbols.
                if (this.isDigit(c) || c === "-" || c === ".") {
                    // may or may not be a number
                    this.identifierNumberToken();
                }
                else if (this.isValidIdentifier(c)) {
                    // filtered out the potential numbers
                    // these are definitely identifiers
                    this.identifierToken();
                }
                else {
                    // error
                    throw new TokenizerError.UnexpectedCharacterError(this.line, this.col, c);
                }
                break;
        }
    }
    comment() {
        while (!(this.peek() == "|" && this.peekNext() == "#") && !this.isAtEnd()) {
            if (this.peek() === "\n") {
                this.line++;
                this.col = 0;
            }
            this.advance();
        }
        if (this.isAtEnd()) {
            throw new TokenizerError.UnexpectedEOFError(this.line, this.col);
        }
        this.jump();
        this.jump();
    }
    identifierToken() {
        while (this.isValidIdentifier(this.peek()))
            this.advance();
        this.addToken(this.checkKeyword());
    }
    identifierTokenLoose() {
        // this is a special case for identifiers
        // ignore the pipe character
        this.jump();
        while (this.peek() != "|" && !this.isAtEnd()) {
            if (this.peek() === "\n") {
                this.line++;
                this.col = 0;
            }
            this.advance();
        }
        if (this.isAtEnd()) {
            throw new TokenizerError.UnexpectedEOFError(this.line, this.col);
        }
        this.addToken(this.checkKeyword());
        // ignore the closing pipe character
        this.jump();
    }
    identifierNumberToken() {
        // only executes when the first digit was already found to be a number.
        // we treat this as a number UNTIL we find it no longer behaves like one.
        var first = this.peekPrev();
        var validNumber = true;
        var hasDot = first === "." ? true : false;
        while (this.isValidIdentifier(this.peek())) {
            var c = this.peek();
            if (!this.isDigit(c)) {
                if (c === ".") {
                    // still can be a number
                    if (hasDot) {
                        validNumber = false;
                    }
                    else if (this.isDigit(this.peekNext()) ||
                        this.isWhitespace(this.peekNext())) {
                        hasDot = true;
                    }
                    else {
                        validNumber = false;
                    }
                }
                else {
                    validNumber = false;
                }
            }
            this.advance();
        }
        // if the number is a single dot, single - or just "-.", it is not a number.
        let lexeme = this.source.substring(this.start, this.current);
        switch (lexeme) {
            case ".":
            case "-":
            case "-.":
                validNumber = false;
                break;
            default:
                // do nothing
                break;
        }
        if (validNumber) {
            this.addToken(token_type_1.TokenType.NUMBER, parseFloat(lexeme));
        }
        else {
            this.addToken(this.checkKeyword());
        }
    }
    checkKeyword() {
        var text = this.source.substring(this.start, this.current);
        if (text[0] === "|") {
            // trim text first
            text = this.source.substring(this.start + 1, this.current - 1);
        }
        if (keywords.has(text)) {
            return keywords.get(text);
        }
        return token_type_1.TokenType.IDENTIFIER;
    }
    stringToken() {
        while (this.peek() != '"' && !this.isAtEnd()) {
            if (this.peek() === "\n") {
                this.line++;
                this.col = 0;
            }
            this.advance();
        }
        if (this.isAtEnd()) {
            throw new TokenizerError.UnexpectedEOFError(this.line, this.col);
        }
        // closing "
        this.advance();
        // trim the surrounding quotes
        const value = this.source.substring(this.start + 1, this.current - 1);
        this.addToken(token_type_1.TokenType.STRING, value);
    }
    booleanToken() {
        this.addToken(token_type_1.TokenType.BOOLEAN, this.peekPrev() === "t" ? true : false);
    }
    match(expected) {
        if (this.isAtEnd())
            return false;
        if (this.source.charAt(this.current) != expected)
            return false;
        this.current++;
        return true;
    }
    peek() {
        if (this.isAtEnd())
            return "\0";
        return this.source.charAt(this.current);
    }
    peekNext() {
        if (this.current + 1 >= this.source.length)
            return "\0";
        return this.source.charAt(this.current + 1);
    }
    peekPrev() {
        if (this.current - 1 < 0)
            return "\0";
        return this.source.charAt(this.current - 1);
    }
    isDigit(c) {
        return c >= "0" && c <= "9";
    }
    isSpecialSyntax(c) {
        return c === "(" || c === ")" || c === "[" || c === "]" || c === ";" || c === "|";
    }
    isValidIdentifier(c) {
        return !this.isWhitespace(c) && !this.isSpecialSyntax(c);
    }
    isWhitespace(c) {
        return c === " " || c === "\0" || c === "\n" || c === "\r" || c === "\t";
    }
}
exports.Tokenizer = Tokenizer;
//# sourceMappingURL=tokenizer.js.map