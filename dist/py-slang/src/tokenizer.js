"use strict";
/*
* Full disclosure: The general structure of this file is adapted from my own
* Rust implementation of a scanner
* https://github.com/Fidget-Spinner/crafting_interpreters/blob/main/rust/src/scanner.rs.
* That is in turn is adapted from the Java code written by the excellent book,
* "Crafting Interpreters" https://craftinginterpreters.com/scanning.html.
* Said book's copyright is under Robert Nystrom.
* I've included the MIT license that code snippets from
* the book is licensed under down below. See
* https://github.com/munificent/craftinginterpreters/blob/master/LICENSE
*
* The changes I've made: I have rewritten basically everything from scratch.
* Only the method names and overall method APIs
* are the same. Their internal behaviors are quite different as the scanner
* in the book parses a JS-like language, not Python.
*
* - The book was written in Java. I have written this in TypeScript.
* - The scanner supports a whitespace significant language now.
* - Also added support for column numbers for better error messages in the future.
* - Also added better errors.
* - Also added forbidden identifiers.
*
*
    Permission is hereby granted, free of charge, to any person obtaining a copy
    of this software and associated documentation files (the "Software"), to
    deal in the Software without restriction, including without limitation the
    rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
    sell copies of the Software, and to permit persons to whom the Software is
    furnished to do so, subject to the following conditions:

    The above copyright notice and this permission notice shall be included in
    all copies or substantial portions of the Software.

    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
    IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
    FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
    AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
    LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
    FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS
    IN THE SOFTWARE.
* */
Object.defineProperty(exports, "__esModule", { value: true });
exports.Tokenizer = exports.SPECIAL_IDENTIFIER_TOKENS = exports.Token = void 0;
const tokens_1 = require("./tokens");
const errors_1 = require("./errors");
class Token {
    constructor(type, lexeme, line, col, indexInSource) {
        this.type = type;
        this.lexeme = lexeme;
        this.line = line;
        this.col = col;
        this.indexInSource = indexInSource;
    }
}
exports.Token = Token;
const specialIdentifiers = new Map([
    ["and", tokens_1.TokenType.AND],
    ["or", tokens_1.TokenType.OR],
    ["while", tokens_1.TokenType.WHILE],
    ["for", tokens_1.TokenType.FOR],
    ["None", tokens_1.TokenType.NONE],
    ["is", tokens_1.TokenType.IS],
    ["not", tokens_1.TokenType.NOT],
    ["pass", tokens_1.TokenType.PASS],
    ["def", tokens_1.TokenType.DEF],
    ["lambda", tokens_1.TokenType.LAMBDA],
    ["from", tokens_1.TokenType.FROM],
    ["True", tokens_1.TokenType.TRUE],
    ["False", tokens_1.TokenType.FALSE],
    ["break", tokens_1.TokenType.BREAK],
    ["continue", tokens_1.TokenType.CONTINUE],
    ["return", tokens_1.TokenType.RETURN],
    ["assert", tokens_1.TokenType.ASSERT],
    ["import", tokens_1.TokenType.IMPORT],
    ["global", tokens_1.TokenType.GLOBAL],
    ["nonlocal", tokens_1.TokenType.NONLOCAL],
    ["if", tokens_1.TokenType.IF],
    ["elif", tokens_1.TokenType.ELIF],
    ["else", tokens_1.TokenType.ELSE],
    ["in", tokens_1.TokenType.IN],
]);
exports.SPECIAL_IDENTIFIER_TOKENS = Array.from(specialIdentifiers.values());
class Tokenizer {
    // forbiddenOperators: Set<TokenType>;
    constructor(source) {
        this.source = source;
        this.tokens = [];
        this.start = 0;
        this.current = 0;
        this.line = 0;
        this.col = 0;
        this.indentStack = [0];
        this.specialIdentifiers = specialIdentifiers;
        // Not used by us, but should be kept reserved as per Python spec
        this.forbiddenIdentifiers = new Map([
            ["async", tokens_1.TokenType.ASYNC],
            ["await", tokens_1.TokenType.AWAIT],
            ["yield", tokens_1.TokenType.YIELD],
            ["with", tokens_1.TokenType.WITH],
            ["del", tokens_1.TokenType.DEL],
            ["try", tokens_1.TokenType.TRY],
            ["except", tokens_1.TokenType.EXCEPT],
            ["finally", tokens_1.TokenType.FINALLY],
            ["raise", tokens_1.TokenType.RAISE],
        ]);
        // Operators that are valid in Python, but invalid for our use case.
        // this.forbiddenOperators = new Set([
        //     TokenType.AT,
        //     // Augmented assign e.g. *=
        //     TokenType.ATEQUAL,
        //     TokenType.PLUSEQUAL,
        //     TokenType.MINEQUAL,
        //     TokenType.STAREQUAL,
        //     TokenType.SLASHEQUAL,
        //     TokenType.PERCENTEQUAL,
        //     TokenType.AMPEREQUAL,
        //     TokenType.VBAREQUAL,
        //     TokenType.CIRCUMFLEXEQUAL,
        //     TokenType.LEFTSHIFTEQUAL,
        //     TokenType.RIGHTSHIFTEQUAL,
        //     TokenType.DOUBLESTAREQUAL,
        //     TokenType.DOUBLESLASHEQUAL,
        // ])
        this.parenthesesLevel = 0;
    }
    isAtEnd() {
        return this.current >= this.source.length;
    }
    advance() {
        const res = this.source[this.current];
        this.current += 1;
        this.col += 1;
        return res;
    }
    /* Single character lookahead. */
    peek() {
        return this.isAtEnd() ? '\0' : this.source[this.current];
    }
    /* Double character lookahead. */
    overwriteToken(type) {
        const previousToken = this.tokens[this.tokens.length - 1];
        const lexeme = this.source.slice(previousToken.indexInSource, this.current);
        this.tokens[this.tokens.length - 1] = new Token(type, lexeme, previousToken.line, previousToken.col, previousToken.indexInSource);
    }
    addToken(type) {
        const line = this.line;
        const col = this.col;
        const lexeme = this.source.slice(this.start, this.current);
        this.tokens.push(new Token(type, lexeme, line, col, this.current - lexeme.length));
    }
    // Checks that the current character matches a pattern. If so the character is consumed, else nothing is consumed.
    matches(pattern) {
        if (this.isAtEnd()) {
            return false;
        }
        else {
            if (this.source[this.current] === pattern) {
                this.col += 1;
                this.current += 1;
                return true;
            }
            return false;
        }
    }
    isAlpha(c) {
        return /^[A-Za-z]$/i.test(c);
    }
    isDigit(c) {
        return /^[0-9]$/.test(c);
    }
    isHexa(c) {
        return /^[0-9A-Fa-f]$/i.test(c);
    }
    isOcta(c) {
        return /^[0-7]$/.test(c);
    }
    isBinary(c) {
        return /^[0-1]$/.test(c);
    }
    isIdentifier(c) {
        return c === '_' || this.isAlpha(c) || this.isDigit(c);
    }
    baseNumber() {
        if (this.peek() === 'x') {
            this.advance();
            while (this.isHexa(this.peek())) {
                this.advance();
            }
            this.addToken(tokens_1.TokenType.BIGINT);
        }
        else if (this.peek() === 'o') {
            this.advance();
            while (this.isOcta(this.peek())) {
                this.advance();
            }
            this.addToken(tokens_1.TokenType.BIGINT);
        }
        else if (this.peek() === 'b') {
            this.advance();
            while (this.isBinary(this.peek())) {
                this.advance();
            }
            this.addToken(tokens_1.TokenType.BIGINT);
        }
        else {
            while (this.isDigit(this.peek())) {
                this.advance();
            }
            this.addToken(tokens_1.TokenType.BIGINT);
        }
    }
    number() {
        while (this.isDigit(this.peek())) {
            this.advance();
        }
        // Fractional part
        if (this.peek() === '.') {
            this.advance();
            while (this.isDigit(this.peek())) {
                this.advance();
            }
            this.addToken(tokens_1.TokenType.NUMBER);
        }
        else {
            this.addToken(tokens_1.TokenType.BIGINT);
        }
    }
    name() {
        while (this.isIdentifier(this.peek())) {
            this.advance();
        }
        const identifier = this.source.slice(this.start, this.current);
        if (!!this.forbiddenIdentifiers.get(identifier)) {
            throw new errors_1.TokenizerErrors.ForbiddenIdentifierError(this.line, this.col, this.source, this.start);
        }
        const specialIdent = this.specialIdentifiers.get(identifier);
        if (specialIdent !== undefined) {
            /* Merge multi-token operators, like 'is not', 'not in' */
            const previousToken = this.tokens[this.tokens.length - 1];
            switch (specialIdent) {
                case tokens_1.TokenType.NOT:
                    if (previousToken.type === tokens_1.TokenType.IS) {
                        this.overwriteToken(tokens_1.TokenType.ISNOT);
                    }
                    else {
                        this.addToken(specialIdent);
                    }
                    return;
                case tokens_1.TokenType.IN:
                    if (previousToken.type === tokens_1.TokenType.NOT) {
                        this.overwriteToken(tokens_1.TokenType.NOTIN);
                    }
                    else {
                        this.addToken(specialIdent);
                    }
                    return;
                default:
                    this.addToken(specialIdent);
            }
        }
        else {
            this.addToken(tokens_1.TokenType.NAME);
        }
    }
    scanToken() {
        const c = this.advance();
        // KJ: I really hope the JS runtime optimizes this to a jump table...
        switch (c) {
            //// SPECIAL MARKERS
            // Comment -- advance to end of line.
            case '#':
                while ((this.peek() != '\n' || this.peek() != '\r') && !this.isAtEnd()) {
                    this.advance();
                }
                break;
            case ':':
                this.addToken(this.matches(':') ? tokens_1.TokenType.DOUBLECOLON : tokens_1.TokenType.COLON);
                break;
            // All non-significant whitespace
            case ' ':
                break;
            // CR LF on Windows
            case '\r':
                if (this.matches('\n')) {
                    // fall through
                }
                else {
                    break;
                }
            case '\n':
                if (this.parenthesesLevel > 0) {
                    this.line += 1;
                    this.col = 0;
                    break;
                }
                this.addToken(tokens_1.TokenType.NEWLINE);
                this.line += 1;
                this.col = 0;
                let accLeadingWhiteSpace = 0;
                // Detect significant whitespace
                while (this.peek() === " " && !this.isAtEnd()) {
                    accLeadingWhiteSpace += 1;
                    // Consume the rest of the line's leading whitespace.
                    this.advance();
                }
                // The following block handles things like
                /*
                def foo():
                    pass
                             <---- this newline should be zapped
                    pass     <---- this should be part of the block
                 */
                while ((this.peek() === "\n" || this.peek() === "\r") && !this.isAtEnd()) {
                    // Handle \r\n on Windows
                    if (this.peek() === "\r") {
                        this.advance();
                        if (this.peek() === "\n") {
                            this.advance();
                        }
                    }
                    else {
                        this.advance();
                    }
                    this.line += 1;
                    this.col = 0;
                    accLeadingWhiteSpace = 0;
                    // Detect significant whitespace
                    while (this.peek() === " " && !this.isAtEnd()) {
                        accLeadingWhiteSpace += 1;
                        // Consume the rest of the line's leading whitespace.
                        this.advance();
                    }
                }
                if (accLeadingWhiteSpace % 4 !== 0) {
                    throw new errors_1.TokenizerErrors.NonFourIndentError(this.line, this.col, this.source, this.current);
                }
                const tos = this.indentStack[this.indentStack.length - 1];
                if (accLeadingWhiteSpace > tos) {
                    this.indentStack.push(accLeadingWhiteSpace);
                    const indents = Math.floor((accLeadingWhiteSpace - tos) / 4);
                    for (let i = 0; i < indents; ++i) {
                        this.addToken(tokens_1.TokenType.INDENT);
                    }
                }
                else if (accLeadingWhiteSpace < tos) {
                    if (this.indentStack.length == 0) {
                        throw new errors_1.TokenizerErrors.InconsistentIndentError(this.line, this.col, this.source, this.current);
                    }
                    const prev = this.indentStack.pop();
                    if (prev === undefined || prev === null) {
                        throw new errors_1.TokenizerErrors.InconsistentIndentError(this.line, this.col, this.source, this.current);
                    }
                    const indents = Math.floor((prev - accLeadingWhiteSpace) / 4);
                    for (let i = 0; i < indents; ++i) {
                        this.addToken(tokens_1.TokenType.DEDENT);
                    }
                }
                break;
            // String
            case '"':
                while (this.peek() != '"' && this.peek() != '\n' && !this.isAtEnd()) {
                    this.advance();
                }
                if (this.peek() === '\n' || this.isAtEnd()) {
                    throw new errors_1.TokenizerErrors.UnterminatedStringError(this.line, this.col, this.source, this.start, this.current);
                }
                // Consume closing "
                this.advance();
                this.addToken(tokens_1.TokenType.STRING);
                break;
            // Number... I wish JS had match statements :(
            case '0':
                this.baseNumber();
                break;
            case '1':
            case '2':
            case '3':
            case '4':
            case '5':
            case '6':
            case '7':
            case '8':
            case '9':
                this.number();
                break;
            //// Everything else
            case '(':
                this.addToken(tokens_1.TokenType.LPAR);
                this.parenthesesLevel++;
                break;
            case ')':
                this.addToken(tokens_1.TokenType.RPAR);
                if (this.parenthesesLevel === 0) {
                    throw new errors_1.TokenizerErrors.NonMatchingParenthesesError(this.line, this.col, this.source, this.current);
                }
                this.parenthesesLevel--;
                break;
            case ',':
                this.addToken(tokens_1.TokenType.COMMA);
                break;
            //// OPERATORS
            case '-':
                if (this.matches('=')) {
                    this.raiseForbiddenOperator();
                }
                this.addToken(tokens_1.TokenType.MINUS);
                break;
            case '+':
                if (this.matches('=')) {
                    this.raiseForbiddenOperator();
                }
                this.addToken(tokens_1.TokenType.PLUS);
                break;
            case '*':
                if (this.matches('=')) {
                    this.raiseForbiddenOperator();
                }
                this.addToken(this.matches('*') ? tokens_1.TokenType.DOUBLESTAR : tokens_1.TokenType.STAR);
                break;
            case '/':
                if (this.matches('=')) {
                    this.raiseForbiddenOperator();
                }
                this.addToken(this.matches('/') ? tokens_1.TokenType.DOUBLESLASH : tokens_1.TokenType.SLASH);
                break;
            case '%':
                if (this.matches('=')) {
                    this.raiseForbiddenOperator();
                }
                this.addToken(tokens_1.TokenType.PERCENT);
                break;
            case '!':
                this.addToken(this.matches('=') ? tokens_1.TokenType.NOTEQUAL : tokens_1.TokenType.BANG);
                break;
            case '=':
                this.addToken(this.matches('=') ? tokens_1.TokenType.DOUBLEEQUAL : tokens_1.TokenType.EQUAL);
                break;
            case '<':
                this.addToken(this.matches('=') ? tokens_1.TokenType.LESSEQUAL : tokens_1.TokenType.LESS);
                break;
            case '>':
                this.addToken(this.matches('=') ? tokens_1.TokenType.GREATEREQUAL : tokens_1.TokenType.GREATER);
                break;
            default:
                // Identifier start
                if (c === '_' || this.isAlpha(c)) {
                    this.name();
                    break;
                }
                this.matchForbiddenOperator(c);
                throw new errors_1.TokenizerErrors.UnknownTokenError(c, this.line, this.col, this.source, this.current);
        }
    }
    matchForbiddenOperator(ch) {
        switch (ch) {
            case '@':
            case '|':
            case '&':
            case '~':
            case '^':
                this.matches('=');
                this.raiseForbiddenOperator();
                break;
            default:
                break;
        }
    }
    scanEverything() {
        while (!this.isAtEnd()) {
            this.start = this.current;
            this.scanToken();
        }
        // Unravel the indent stack
        while (this.indentStack[this.indentStack.length - 1] !== 0) {
            this.indentStack.pop();
            this.addToken(tokens_1.TokenType.DEDENT);
        }
        this.tokens.push(new Token(tokens_1.TokenType.ENDMARKER, "", this.line, this.col, this.current));
        return this.tokens;
    }
    printTokens() {
        for (const token of this.tokens) {
            console.log(`${token.indexInSource}:${token.line}-${token.line},${token.indexInSource + token.lexeme.length}\t\t\t\
            ${tokens_1.TokenType[token.type]}\t\t\t'${token.lexeme}'`);
        }
    }
    raiseForbiddenOperator() {
        throw new errors_1.TokenizerErrors.ForbiddenOperatorError(this.line, this.col, this.source, this.start, this.current);
    }
}
exports.Tokenizer = Tokenizer;
//# sourceMappingURL=tokenizer.js.map