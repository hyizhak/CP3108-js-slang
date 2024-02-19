"use strict";
/*
* Full disclosure: some of the functions and general layout of the file is
* from my own implementation of a parser
* in Rust.
* https://github.com/Fidget-Spinner/crafting_interpreters/blob/main/rust/src/parser.rs
*
* That is in turn an implementation of the book "Crafting Interpreters" by
* Robert Nystrom, which implements an interpreter in Java.
* https://craftinginterpreters.com/parsing-expressions.html.
* I've included the MIT license that code snippets from
* the book is licensed under down below. See
* https://github.com/munificent/craftinginterpreters/blob/master/LICENSE
*
*
* My changes:
*   - The book was written in Java. I have written this in TypeScript.
*   - My Rust implementation uses pattern matching, but the visitor pattern is
*     used here.
*   - Additionally, the production rules are completely different
*     from the book as a whole different language is being parsed.
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
**/
Object.defineProperty(exports, "__esModule", { value: true });
exports.Parser = void 0;
const tokenizer_1 = require("./tokenizer");
const tokens_1 = require("./tokens");
const ast_types_1 = require("./ast-types");
const errors_1 = require("./errors");
const PSEUD_NAMES = [
    tokens_1.TokenType.TRUE,
    tokens_1.TokenType.FALSE,
    tokens_1.TokenType.NONE,
];
class Parser {
    constructor(source, tokens) {
        this.source = source;
        this.tokens = tokens;
        this.current = 0;
    }
    // Consumes tokens while tokenTypes matches.
    match(...tokenTypes) {
        for (const tokenType of tokenTypes) {
            if (this.check(tokenType)) {
                this.advance();
                return true;
            }
        }
        return false;
    }
    check(...type) {
        if (this.isAtEnd()) {
            return false;
        }
        for (const tokenType of type) {
            if (this.peek().type === tokenType) {
                return true;
            }
        }
        return false;
    }
    advance() {
        if (!this.isAtEnd()) {
            this.current += 1;
        }
        return this.previous();
    }
    isAtEnd() {
        return this.peek().type === tokens_1.TokenType.ENDMARKER;
    }
    peek() {
        return this.tokens[this.current];
    }
    previous() {
        return this.tokens[this.current - 1];
    }
    consume(type, message) {
        if (this.check(type))
            return this.advance();
        const token = this.tokens[this.current];
        throw new errors_1.ParserErrors.ExpectedTokenError(this.source, token, message);
    }
    synchronize() {
        this.advance();
        while (!this.isAtEnd()) {
            if (this.match(tokens_1.TokenType.NEWLINE)) {
                return false;
            }
            if (this.match(tokens_1.TokenType.FOR, tokens_1.TokenType.WHILE, tokens_1.TokenType.DEF, tokens_1.TokenType.IF, tokens_1.TokenType.ELIF, tokens_1.TokenType.ELSE, tokens_1.TokenType.RETURN)) {
                return true;
            }
            this.advance();
        }
        return false;
    }
    parse() {
        return this.file_input();
        // return this.expression();
    }
    //// THE NAMES OF THE FOLLOWING FUNCTIONS FOLLOW THE PRODUCTION RULES IN THE GRAMMAR.
    //// HENCE THEIR NAMES MIGHT NOT BE COMPLIANT WITH CAMELCASE
    file_input() {
        const startToken = this.peek();
        const statements = [];
        while (!this.isAtEnd()) {
            if (this.match(tokens_1.TokenType.NEWLINE)) {
                continue;
            }
            statements.push(this.stmt());
        }
        const endToken = this.peek();
        return new ast_types_1.StmtNS.FileInput(startToken, endToken, statements, []);
    }
    stmt() {
        if (this.check(tokens_1.TokenType.DEF, tokens_1.TokenType.FOR, tokens_1.TokenType.IF, tokens_1.TokenType.WHILE)) {
            return this.compound_stmt();
        }
        else if (this.check(tokens_1.TokenType.NAME, ...PSEUD_NAMES, tokens_1.TokenType.NUMBER, tokens_1.TokenType.PASS, tokens_1.TokenType.BREAK, tokens_1.TokenType.CONTINUE, tokens_1.TokenType.RETURN, tokens_1.TokenType.FROM, tokens_1.TokenType.GLOBAL, tokens_1.TokenType.NONLOCAL, tokens_1.TokenType.ASSERT, tokens_1.TokenType.LPAR, ...tokenizer_1.SPECIAL_IDENTIFIER_TOKENS)) {
            return this.simple_stmt();
        }
        const startToken = this.peek();
        const endToken = this.synchronize() ? this.previous() : this.peek();
        try {
            this.parse_invalid(startToken, endToken);
        }
        catch (e) {
            if (e instanceof errors_1.ParserErrors.BaseParserError) {
                throw (e);
            }
        }
        throw new errors_1.ParserErrors.GenericUnexpectedSyntaxError(startToken.line, startToken.col, this.source, startToken.indexInSource, endToken.indexInSource);
    }
    compound_stmt() {
        if (this.match(tokens_1.TokenType.IF)) {
            return this.if_stmt();
        }
        else if (this.match(tokens_1.TokenType.WHILE)) {
            return this.while_stmt();
        }
        else if (this.match(tokens_1.TokenType.FOR)) {
            return this.for_stmt();
        }
        else if (this.match(tokens_1.TokenType.DEF)) {
            return this.funcdef();
        }
        throw new Error("Unreachable code path");
    }
    if_stmt() {
        const startToken = this.previous();
        let start = this.previous();
        let cond = this.test();
        this.consume(tokens_1.TokenType.COLON, "Expected ':' after if");
        let block = this.suite();
        let elseStmt = null;
        if (this.match(tokens_1.TokenType.ELIF)) {
            elseStmt = [this.if_stmt()];
        }
        else if (this.match(tokens_1.TokenType.ELSE)) {
            this.consume(tokens_1.TokenType.COLON, "Expect ':' after else");
            elseStmt = this.suite();
        }
        else {
            throw new errors_1.ParserErrors.NoElseBlockError(this.source, start);
        }
        const endToken = this.previous();
        return new ast_types_1.StmtNS.If(startToken, endToken, cond, block, elseStmt);
    }
    while_stmt() {
        const startToken = this.peek();
        let cond = this.test();
        this.consume(tokens_1.TokenType.COLON, "Expected ':' after while");
        let block = this.suite();
        const endToken = this.previous();
        return new ast_types_1.StmtNS.While(startToken, endToken, cond, block);
    }
    for_stmt() {
        const startToken = this.peek();
        let target = this.advance();
        this.consume(tokens_1.TokenType.IN, "Expected in after for");
        let iter = this.test();
        this.consume(tokens_1.TokenType.COLON, "Expected ':' after for");
        let block = this.suite();
        const endToken = this.previous();
        return new ast_types_1.StmtNS.For(startToken, endToken, target, iter, block);
    }
    funcdef() {
        const startToken = this.peek();
        let name = this.advance();
        let args = this.parameters();
        this.consume(tokens_1.TokenType.COLON, "Expected ':' after def");
        let block = this.suite();
        const endToken = this.previous();
        return new ast_types_1.StmtNS.FunctionDef(startToken, endToken, name, args, block, []);
    }
    simple_stmt() {
        const startToken = this.peek();
        let res = null;
        if (this.match(tokens_1.TokenType.NAME)) {
            res = this.assign_stmt();
        }
        else if (this.match(tokens_1.TokenType.PASS)) {
            res = new ast_types_1.StmtNS.Pass(startToken, startToken);
        }
        else if (this.match(tokens_1.TokenType.BREAK)) {
            res = new ast_types_1.StmtNS.Break(startToken, startToken);
        }
        else if (this.match(tokens_1.TokenType.CONTINUE)) {
            res = new ast_types_1.StmtNS.Continue(startToken, startToken);
        }
        else if (this.match(tokens_1.TokenType.RETURN)) {
            res = new ast_types_1.StmtNS.Return(startToken, startToken, this.check(tokens_1.TokenType.NEWLINE) ? null : this.test());
        }
        else if (this.match(tokens_1.TokenType.FROM)) {
            res = this.import_from();
        }
        else if (this.match(tokens_1.TokenType.GLOBAL)) {
            res = new ast_types_1.StmtNS.Global(startToken, startToken, this.advance());
        }
        else if (this.match(tokens_1.TokenType.NONLOCAL)) {
            res = new ast_types_1.StmtNS.NonLocal(startToken, startToken, this.advance());
        }
        else if (this.match(tokens_1.TokenType.ASSERT)) {
            res = new ast_types_1.StmtNS.Assert(startToken, startToken, this.test());
        }
        else if (this.check(tokens_1.TokenType.LPAR, tokens_1.TokenType.NUMBER, ...tokenizer_1.SPECIAL_IDENTIFIER_TOKENS)) {
            res = new ast_types_1.StmtNS.SimpleExpr(startToken, startToken, this.test());
        }
        else {
            throw new Error("Unreachable code path");
        }
        this.consume(tokens_1.TokenType.NEWLINE, "Expected newline");
        return res;
    }
    assign_stmt() {
        const startToken = this.previous();
        const name = this.previous();
        if (this.check(tokens_1.TokenType.COLON)) {
            const ann = this.test();
            this.consume(tokens_1.TokenType.EQUAL, "Expect equal in assignment");
            const expr = this.test();
            return new ast_types_1.StmtNS.AnnAssign(startToken, this.previous(), name, expr, ann);
        }
        else if (this.check(tokens_1.TokenType.EQUAL)) {
            this.advance();
            const expr = this.test();
            return new ast_types_1.StmtNS.Assign(startToken, this.previous(), name, expr);
        }
        else {
            this.current--;
            const expr = this.test();
            return new ast_types_1.StmtNS.SimpleExpr(startToken, this.previous(), expr);
        }
    }
    import_from() {
        const startToken = this.previous();
        const module = this.advance();
        this.consume(tokens_1.TokenType.IMPORT, "Expected import keyword");
        let params;
        if (this.check(tokens_1.TokenType.NAME)) {
            params = [this.advance()];
        }
        else {
            params = this.parameters();
        }
        return new ast_types_1.StmtNS.FromImport(startToken, this.previous(), module, params);
    }
    parameters() {
        this.consume(tokens_1.TokenType.LPAR, "Expected opening parentheses");
        let res = this.varparamslist();
        this.consume(tokens_1.TokenType.RPAR, "Expected closing parentheses");
        return res;
    }
    test() {
        if (this.match(tokens_1.TokenType.LAMBDA)) {
            return this.lambdef();
        }
        else {
            const startToken = this.peek();
            let consequent = this.or_test();
            if (this.match(tokens_1.TokenType.IF)) {
                const predicate = this.or_test();
                this.consume(tokens_1.TokenType.ELSE, "Expected else");
                const alternative = this.test();
                return new ast_types_1.ExprNS.Ternary(startToken, this.previous(), predicate, consequent, alternative);
            }
            return consequent;
        }
    }
    lambdef() {
        const startToken = this.previous();
        let args = this.varparamslist();
        if (this.match(tokens_1.TokenType.COLON)) {
            let test = this.test();
            return new ast_types_1.ExprNS.Lambda(startToken, this.previous(), args, test);
        }
        else if (this.match(tokens_1.TokenType.DOUBLECOLON)) {
            let block = this.suite();
            return new ast_types_1.ExprNS.MultiLambda(startToken, this.previous(), args, block, []);
        }
        this.consume(tokens_1.TokenType.COLON, "Expected ':' after lambda");
        throw new Error("unreachable code path");
    }
    suite() {
        let stmts = [];
        if (this.match(tokens_1.TokenType.NEWLINE)) {
            this.consume(tokens_1.TokenType.INDENT, "Expected indent");
            while (!this.match(tokens_1.TokenType.DEDENT)) {
                stmts.push(this.stmt());
            }
        }
        return stmts;
    }
    varparamslist() {
        let params = [];
        while (!this.check(tokens_1.TokenType.COLON) && !this.check(tokens_1.TokenType.RPAR)) {
            let name = this.consume(tokens_1.TokenType.NAME, "Expected a proper identifier in parameter");
            params.push(name);
            if (!this.match(tokens_1.TokenType.COMMA)) {
                break;
            }
        }
        return params;
    }
    or_test() {
        const startToken = this.peek();
        let expr = this.and_test();
        while (this.match(tokens_1.TokenType.OR)) {
            const operator = this.previous();
            const right = this.and_test();
            expr = new ast_types_1.ExprNS.BoolOp(startToken, this.previous(), expr, operator, right);
        }
        return expr;
    }
    and_test() {
        const startToken = this.peek();
        let expr = this.not_test();
        while (this.match(tokens_1.TokenType.AND)) {
            const operator = this.previous();
            const right = this.not_test();
            expr = new ast_types_1.ExprNS.BoolOp(startToken, this.previous(), expr, operator, right);
        }
        return expr;
    }
    not_test() {
        const startToken = this.peek();
        if (this.match(tokens_1.TokenType.NOT, tokens_1.TokenType.BANG)) {
            const operator = this.previous();
            return new ast_types_1.ExprNS.Unary(startToken, this.previous(), operator, this.not_test());
        }
        return this.comparison();
    }
    comparison() {
        const startToken = this.peek();
        let expr = this.arith_expr();
        // @TODO: Add the rest of the comparisons
        while (this.match(tokens_1.TokenType.LESS, tokens_1.TokenType.GREATER, tokens_1.TokenType.DOUBLEEQUAL, tokens_1.TokenType.GREATEREQUAL, tokens_1.TokenType.LESSEQUAL, tokens_1.TokenType.NOTEQUAL, tokens_1.TokenType.IS, tokens_1.TokenType.ISNOT, tokens_1.TokenType.IN, tokens_1.TokenType.NOTIN)) {
            const operator = this.previous();
            const right = this.arith_expr();
            expr = new ast_types_1.ExprNS.Compare(startToken, this.previous(), expr, operator, right);
        }
        return expr;
    }
    arith_expr() {
        const startToken = this.peek();
        let expr = this.term();
        while (this.match(tokens_1.TokenType.PLUS, tokens_1.TokenType.MINUS)) {
            const token = this.previous();
            const right = this.term();
            expr = new ast_types_1.ExprNS.Binary(startToken, this.previous(), expr, token, right);
        }
        return expr;
    }
    term() {
        const startToken = this.peek();
        let expr = this.factor();
        while (this.match(tokens_1.TokenType.STAR, tokens_1.TokenType.SLASH, tokens_1.TokenType.PERCENT, tokens_1.TokenType.DOUBLESLASH)) {
            const token = this.previous();
            const right = this.factor();
            expr = new ast_types_1.ExprNS.Binary(startToken, this.previous(), expr, token, right);
        }
        return expr;
    }
    factor() {
        const startToken = this.peek();
        if (this.match(tokens_1.TokenType.PLUS, tokens_1.TokenType.MINUS)) {
            const op = this.previous();
            const factor = this.factor();
            const endToken = this.previous();
            return new ast_types_1.ExprNS.Unary(startToken, endToken, op, factor);
        }
        return this.power();
    }
    power() {
        const startToken = this.peek();
        let expr = this.atom_expr();
        if (this.match(tokens_1.TokenType.DOUBLESTAR)) {
            const token = this.previous();
            const right = this.factor();
            const endToken = this.previous();
            return new ast_types_1.ExprNS.Binary(startToken, endToken, expr, token, right);
        }
        return expr;
    }
    atom_expr() {
        let startToken = this.peek();
        let ato = this.atom();
        let res;
        if (this.match(tokens_1.TokenType.LPAR)) {
            let args = this.arglist();
            const endToken = this.previous();
            res = new ast_types_1.ExprNS.Call(startToken, endToken, ato, args);
        }
        else {
            return ato;
        }
        // To handle things like x()()()
        startToken = this.peek();
        while (this.match(tokens_1.TokenType.LPAR)) {
            let args = this.arglist();
            res = new ast_types_1.ExprNS.Call(startToken, this.previous(), res, args);
            startToken = this.peek();
        }
        return res;
    }
    arglist() {
        let args = [];
        while (!this.check(tokens_1.TokenType.RPAR)) {
            let arg = this.test();
            args.push(arg);
            if (!this.match(tokens_1.TokenType.COMMA)) {
                break;
            }
        }
        this.consume(tokens_1.TokenType.RPAR, "Expected closing ')' after function application");
        return args;
    }
    atom() {
        const startToken = this.peek();
        if (this.match(tokens_1.TokenType.TRUE))
            return new ast_types_1.ExprNS.Literal(startToken, this.previous(), true);
        if (this.match(tokens_1.TokenType.FALSE))
            return new ast_types_1.ExprNS.Literal(startToken, this.previous(), false);
        if (this.match(tokens_1.TokenType.STRING)) {
            return new ast_types_1.ExprNS.Literal(startToken, this.previous(), this.previous().lexeme);
        }
        if (this.match(tokens_1.TokenType.NUMBER)) {
            return new ast_types_1.ExprNS.Literal(startToken, this.previous(), Number(this.previous().lexeme));
        }
        if (this.match(tokens_1.TokenType.BIGINT)) {
            return new ast_types_1.ExprNS.Literal(startToken, this.previous(), BigInt(this.previous().lexeme));
        }
        if (this.match(tokens_1.TokenType.NAME, ...PSEUD_NAMES)) {
            return new ast_types_1.ExprNS.Variable(startToken, this.previous(), this.previous());
        }
        if (this.match(tokens_1.TokenType.LPAR)) {
            let expr = this.test();
            this.consume(tokens_1.TokenType.RPAR, "Expected closing ')'");
            return new ast_types_1.ExprNS.Grouping(startToken, this.previous(), expr);
        }
        const startTokenInvalid = this.peek();
        this.synchronize();
        const endTokenInvalid = this.peek();
        throw new errors_1.ParserErrors.GenericUnexpectedSyntaxError(startToken.line, startToken.col, this.source, startTokenInvalid.indexInSource, endTokenInvalid.indexInSource);
    }
    //// INVALID RULES
    parse_invalid(startToken, endToken) {
        // @TODO invalid rules
    }
}
exports.Parser = Parser;
//# sourceMappingURL=parser.js.map