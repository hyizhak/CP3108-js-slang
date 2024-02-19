"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Parser = void 0;
const tokenizer_1 = require("./tokenizer");
const token_type_1 = require("./token-type");
const ParserError = require("./parser-error");
class Group {
    constructor(group, openparen, closeparen = openparen) {
        this.group = group;
        this.loc = openparen
            ? // if openparen exists, then closeparen exists as well
                {
                    start: openparen.pos,
                    end: closeparen.pos,
                }
            : // only go to this case if grouping() was called.
                // 2 cases:
                // 1. group contains a single Token
                // 2. group contains a single Group
                // in both cases we steal the inner group's location
                group[0] instanceof Group
                    ? group[0].loc
                    : {
                        start: group[0].pos,
                        end: group[0].pos,
                    };
    }
    unwrap() {
        return this.group;
    }
    length() {
        return this.group.length;
    }
}
class Parser {
    constructor(source, tokens, chapter = Infinity) {
        this.current = 0;
        this.source = source;
        this.tokens = tokens;
        this.chapter = chapter;
        this.estree = {
            type: "Program",
            body: [],
            sourceType: "script",
        };
    }
    advance() {
        if (!this.isAtEnd())
            this.current++;
        return this.previous();
    }
    isAtEnd() {
        return this.current >= this.tokens.length;
    }
    previous() {
        return this.tokens[this.current - 1];
    }
    validateChapter(c, chapter) {
        if (this.chapter < chapter) {
            throw new ParserError.DisallowedTokenError(this.source, c.pos, c, this.chapter);
        }
    }
    grouping(openparen) {
        let inList = openparen === undefined ? false : true;
        let closeparen = undefined;
        const tokens = [];
        do {
            let c = this.advance();
            switch (c.type) {
                case token_type_1.TokenType.LEFT_PAREN:
                case token_type_1.TokenType.LEFT_BRACKET:
                    tokens.push(this.grouping(c));
                    break;
                case token_type_1.TokenType.RIGHT_PAREN:
                case token_type_1.TokenType.RIGHT_BRACKET:
                    if (!inList) {
                        throw new ParserError.UnexpectedTokenError(this.source, c.pos, c);
                    }
                    else if (!this.matchingParentheses(openparen, c)) {
                        // ^ safe to cast openparen as this only executes
                        // if inList is true, which is only the case if openparen exists
                        throw new ParserError.ParenthesisMismatchError(this.source, c.pos);
                    }
                    closeparen = c;
                    inList = false;
                    break;
                case token_type_1.TokenType.APOSTROPHE:
                case token_type_1.TokenType.BACKTICK:
                case token_type_1.TokenType.HASH:
                case token_type_1.TokenType.COMMA:
                case token_type_1.TokenType.COMMA_AT:
                    // These special notations are converted to their
                    // corresponding "procedure-style" tokens.
                    const convertedToken = this.convertToken(c);
                    // add this token to the next group
                    const nextGroup = this.grouping();
                    nextGroup.group.unshift(convertedToken);
                    // modify the next group's location
                    nextGroup.loc.start = this.toSourceLocation(c).start;
                    tokens.push(nextGroup);
                    break;
                case token_type_1.TokenType.IMPORT:
                case token_type_1.TokenType.EXPORT:
                case token_type_1.TokenType.BEGIN:
                case token_type_1.TokenType.DELAY:
                case token_type_1.TokenType.COND:
                case token_type_1.TokenType.ELSE:
                case token_type_1.TokenType.IDENTIFIER:
                case token_type_1.TokenType.NUMBER:
                case token_type_1.TokenType.BOOLEAN:
                case token_type_1.TokenType.STRING:
                case token_type_1.TokenType.IF:
                case token_type_1.TokenType.DEFINE:
                case token_type_1.TokenType.QUOTE:
                case token_type_1.TokenType.SET:
                case token_type_1.TokenType.LAMBDA:
                case token_type_1.TokenType.LET:
                case token_type_1.TokenType.DOT:
                    tokens.push(c);
                    break;
                case token_type_1.TokenType.EOF:
                    if (inList) {
                        throw new ParserError.UnexpectedEOFError(this.source, c.pos);
                    }
                    else {
                        tokens.push(c);
                    }
                    break;
                default:
                    throw new ParserError.UnexpectedTokenError(this.source, c.pos, c);
            }
        } while (inList);
        return new Group(tokens, openparen, closeparen);
    }
    /**
     * Compares the type of opening and closing parantheses.
     *
     * @param lParen
     * @param rParen
     * @returns Whether the parentheses match.
     */
    matchingParentheses(lParen, rParen) {
        return ((lParen.type === token_type_1.TokenType.LEFT_PAREN &&
            rParen.type === token_type_1.TokenType.RIGHT_PAREN) ||
            (lParen.type === token_type_1.TokenType.LEFT_BRACKET &&
                rParen.type === token_type_1.TokenType.RIGHT_BRACKET));
    }
    /**
     * Converts a token to another representation of itself.
     *
     * @param token A token to be converted.
     * @returns A converted token.
     */
    convertToken(token) {
        switch (token.type) {
            case token_type_1.TokenType.APOSTROPHE:
                return new tokenizer_1.Token(token_type_1.TokenType.QUOTE, token.lexeme, token.literal, token.start, token.end, token.pos.line, token.pos.column);
            case token_type_1.TokenType.BACKTICK:
                return new tokenizer_1.Token(token_type_1.TokenType.QUASIQUOTE, token.lexeme, token.literal, token.start, token.end, token.pos.line, token.pos.column);
            case token_type_1.TokenType.HASH:
                return new tokenizer_1.Token(token_type_1.TokenType.VECTOR, token.lexeme, token.literal, token.start, token.end, token.pos.line, token.pos.column);
            case token_type_1.TokenType.COMMA:
                return new tokenizer_1.Token(token_type_1.TokenType.UNQUOTE, token.lexeme, token.literal, token.start, token.end, token.pos.line, token.pos.column);
            case token_type_1.TokenType.COMMA_AT:
                return new tokenizer_1.Token(token_type_1.TokenType.UNQUOTE_SPLICING, token.lexeme, token.literal, token.start, token.end, token.pos.line, token.pos.column);
            default:
                return token;
        }
    }
    evaluate(expression, onlyExpressions = false, topLevel = false) {
        if (expression instanceof tokenizer_1.Token) {
            return this.evaluateToken(expression);
        }
        else if (expression.length() < 1) {
            // Empty expression.
            // To create a better error message in the future.
            throw new Error("Empty expression.");
        }
        const tokens = expression.unwrap();
        const firstToken = tokens[0]; // First token in expression. Dictates what to do.
        if (firstToken instanceof tokenizer_1.Token) {
            // First token could be a special form.
            // Need to check and handle accordingly.
            switch (firstToken.type) {
                // Scheme 1
                case token_type_1.TokenType.DEFINE:
                    // Assignment statements with no value.
                    if (onlyExpressions) {
                        throw new ParserError.UnexpectedTokenError(this.source, firstToken.pos, firstToken);
                    }
                    return this.evaluateDefine(expression);
                case token_type_1.TokenType.IF:
                    return this.evaluateIf(expression);
                case token_type_1.TokenType.LAMBDA:
                    return this.evaluateLambda(expression);
                case token_type_1.TokenType.LET:
                    return this.evaluateLet(expression);
                case token_type_1.TokenType.COND:
                    return this.evaluateCond(expression);
                case token_type_1.TokenType.ELSE:
                    // This shouldn't exist outside of cond.
                    throw new ParserError.UnexpectedTokenError(this.source, firstToken.pos, firstToken);
                // Scheme 2
                case token_type_1.TokenType.QUOTE:
                case token_type_1.TokenType.QUASIQUOTE:
                    this.validateChapter(firstToken, 2);
                    return this.evaluateQuote(expression);
                case token_type_1.TokenType.UNQUOTE:
                    // This shouldn't exist outside of unquotes.
                    throw new ParserError.UnexpectedTokenError(this.source, firstToken.pos, firstToken);
                // Scheme 3
                case token_type_1.TokenType.SET:
                    this.validateChapter(firstToken, 3);
                    return this.evaluateSet(expression);
                case token_type_1.TokenType.BEGIN:
                    this.validateChapter(firstToken, 3);
                    return this.evaluateBegin(expression);
                case token_type_1.TokenType.DELAY:
                    this.validateChapter(firstToken, 3);
                    return this.evaluateDelay(expression);
                // Not in SICP but required for Source
                case token_type_1.TokenType.IMPORT:
                    if (onlyExpressions) {
                        throw new ParserError.UnexpectedTokenError(this.source, firstToken.pos, firstToken);
                    }
                    if (!topLevel) {
                        throw new ParserError.UnexpectedTokenError(this.source, firstToken.pos, firstToken);
                    }
                    return this.evaluateImport(expression);
                case token_type_1.TokenType.EXPORT:
                    if (onlyExpressions) {
                        throw new ParserError.UnexpectedTokenError(this.source, firstToken.pos, firstToken);
                    }
                    if (!topLevel) {
                        throw new ParserError.UnexpectedTokenError(this.source, firstToken.pos, firstToken);
                    }
                    return this.evaluateExport(expression);
                case token_type_1.TokenType.DOT:
                    // This shouldn't exist here
                    throw new ParserError.UnexpectedTokenError(this.source, firstToken.pos, firstToken);
                // Outside SICP
                case token_type_1.TokenType.VECTOR:
                case token_type_1.TokenType.UNQUOTE_SPLICING:
                    throw new ParserError.UnsupportedTokenError(this.source, firstToken.pos, firstToken);
                default:
                    // First token is not a special form.
                    // Evaluate as a function call.
                    return this.evaluateApplication(expression);
            }
        }
        // First token is not a token. but instead some sort of expression.
        // Top-level grouping definitely has no special form.
        // Evaluate as a function call.
        return this.evaluateApplication(expression);
    }
    /**
     * Evaluates a definition statement.
     *
     * @param statement A definition statement.
     */
    evaluateDefine(statement) {
        // Validate statement.
        const tokens = statement.unwrap();
        if (tokens.length < 3) {
            throw new ParserError.GenericSyntaxError(this.source, tokens[0].pos);
        }
        // This determines the allowing of constants or variables
        // in the current chapter.
        const definitionLevel = this.chapter < 3 ? "const" : "let";
        // Check whether this defines a variable or a function.
        if (tokens[1] instanceof Group) {
            // It's a function.
            const identifiers = tokens[1].unwrap().map((token) => {
                if (token instanceof Group) {
                    // Error.
                    throw new ParserError.GenericSyntaxError(this.source, token.loc.start);
                }
                if (token.type !== token_type_1.TokenType.IDENTIFIER) {
                    throw new ParserError.GenericSyntaxError(this.source, token.pos);
                }
                return this.evaluateToken(token);
            });
            // We have previously checked if all of these values are identifiers.
            // Therefore, we can safely cast them to identifiers.
            const symbol = identifiers[0];
            const params = identifiers.slice(1);
            const body = [];
            let definitions = true;
            for (let i = 2; i < tokens.length; i++) {
                if (tokens[i] instanceof tokenizer_1.Token ||
                    tokens[i].unwrap()[0] instanceof Group ||
                    tokens[i].unwrap()[0].type !== token_type_1.TokenType.DEFINE) {
                    // The definitions block is over.
                    definitions = false;
                    body.push(i < tokens.length - 1
                        ? // Safe to cast as module declarations are only top level.
                            this.wrapInStatement(this.evaluate(tokens[i]))
                        : this.returnStatement(this.evaluate(tokens[i])));
                }
                else {
                    if (definitions) {
                        body.push(this.wrapInStatement(this.evaluate(tokens[i])));
                    }
                    else {
                        // The definitons block is over, and yet there is a define.
                        throw new ParserError.GenericSyntaxError(this.source, tokens[i].unwrap()[0].pos);
                    }
                }
            }
            return {
                type: "VariableDeclaration",
                loc: statement.loc,
                declarations: [
                    {
                        type: "VariableDeclarator",
                        loc: {
                            start: this.toSourceLocation(tokens[0]).start,
                            end: body[body.length - 1].loc.end,
                        },
                        id: symbol,
                        init: {
                            type: "ArrowFunctionExpression",
                            loc: {
                                start: symbol.loc.start,
                                end: body[body.length - 1].loc.end,
                            },
                            params: params,
                            body: {
                                type: "BlockStatement",
                                loc: {
                                    start: body[0].loc.start,
                                    end: body[body.length - 1].loc.end,
                                },
                                body: body,
                            },
                            expression: false,
                        },
                    },
                ],
                kind: definitionLevel,
            };
        }
        // It's a variable.
        // Once again, validate statement.
        if (tokens.length > 3) {
            throw new ParserError.GenericSyntaxError(this.source, tokens[0].pos);
        }
        const symbol = this.evaluateToken(tokens[1]);
        // Validate symbol.
        if (symbol.type !== "Identifier") {
            throw new ParserError.GenericSyntaxError(this.source, tokens[1].pos);
        }
        const value = this.evaluate(tokens[2], true);
        return {
            type: "VariableDeclaration",
            loc: statement.loc,
            declarations: [
                {
                    type: "VariableDeclarator",
                    loc: {
                        start: this.toSourceLocation(tokens[0]).start,
                        end: value.loc.end,
                    },
                    id: symbol,
                    init: value,
                },
            ],
            kind: definitionLevel,
        };
    }
    /**
     * Evaluates an if statement.
     *
     * @param expression An if expression.
     * @returns A conditional expression.
     */
    evaluateIf(expression) {
        const tokens = expression.unwrap();
        // Validate expression.
        if (tokens.length < 3 || tokens.length > 4) {
            throw new ParserError.GenericSyntaxError(this.source, tokens[0].pos);
        }
        // Convert JavaScript's truthy/falsy values to Scheme's true/false.
        const test_val = this.evaluate(tokens[1], true);
        const test = {
            type: "CallExpression",
            loc: test_val.loc,
            callee: {
                type: "Identifier",
                loc: test_val.loc,
                name: "$true",
            },
            arguments: [test_val],
        };
        const consequent = this.evaluate(tokens[2], true);
        const alternate = tokens.length === 4
            ? this.evaluate(tokens[3], true)
            : {
                type: "Identifier",
                loc: consequent.loc,
                name: "undefined",
            };
        return {
            type: "ConditionalExpression",
            loc: expression.loc,
            test: test,
            consequent: consequent,
            alternate: alternate,
        };
    }
    /**
     * Evaluates a lambda expression.
     *
     * @param expression A lambda expression.
     * @returns A function expression.
     */
    evaluateLambda(expression) {
        const tokens = expression.unwrap();
        if (tokens.length < 3) {
            throw new ParserError.GenericSyntaxError(this.source, tokens[0].pos);
        }
        if (!(tokens[1] instanceof Group)) {
            throw new ParserError.GenericSyntaxError(this.source, tokens[1].pos);
        }
        const params = tokens[1]
            .unwrap()
            .map((param) => {
            if (param instanceof Group) {
                throw new ParserError.GenericSyntaxError(this.source, param.loc.start);
            }
            if (param.type !== token_type_1.TokenType.IDENTIFIER) {
                throw new ParserError.GenericSyntaxError(this.source, param.pos);
            }
            // We have evaluated that this is an identifier.
            return this.evaluateToken(param);
        });
        const body = [];
        let definitions = true;
        for (let i = 2; i < tokens.length; i++) {
            if (tokens[i] instanceof tokenizer_1.Token ||
                tokens[i].unwrap()[0] instanceof Group ||
                tokens[i].unwrap()[0].type !== token_type_1.TokenType.DEFINE) {
                // The definitions block is over.
                definitions = false;
                body.push(i < tokens.length - 1
                    ? // Safe to cast as module declarations are only top level.
                        this.wrapInStatement(this.evaluate(tokens[i]))
                    : this.returnStatement(this.evaluate(tokens[i])));
            }
            else {
                if (definitions) {
                    body.push(this.wrapInStatement(this.evaluate(tokens[i])));
                }
                else {
                    // The definitons block is over, and yet there is a define.
                    throw new ParserError.GenericSyntaxError(this.source, tokens[i].unwrap()[0].pos);
                }
            }
        }
        return {
            type: "ArrowFunctionExpression",
            loc: expression.loc,
            params: params,
            body: {
                type: "BlockStatement",
                loc: {
                    start: body[0].loc.start,
                    end: body[body.length - 1].loc.end,
                },
                body: body,
            },
            expression: false,
        };
    }
    /**
     * Evaluates a let expression.
     * let is syntactic sugar for an invoked lambda procedure.
     *
     * @param expression A let expression.
     * @returns An IIFE.
     */
    evaluateLet(expression) {
        const tokens = expression.unwrap();
        if (tokens.length < 3) {
            throw new ParserError.GenericSyntaxError(this.source, tokens[0].pos);
        }
        if (!(tokens[1] instanceof Group)) {
            throw new ParserError.GenericSyntaxError(this.source, tokens[1].pos);
        }
        const declaredVariables = [];
        const declaredValues = [];
        const declarations = tokens[1].unwrap();
        for (let i = 0; i < declarations.length; i++) {
            // Make sure that the declaration is a group.
            if (!(declarations[i] instanceof Group)) {
                throw new ParserError.GenericSyntaxError(this.source, declarations[i].pos);
            }
            // Make sure that the declaration is of the form (x y).
            if (declarations[i].length() !== 2) {
                throw new ParserError.GenericSyntaxError(this.source, declarations[i].loc.start);
            }
            const declaration = declarations[i].unwrap();
            if (!(declaration[0] instanceof tokenizer_1.Token)) {
                throw new ParserError.GenericSyntaxError(this.source, declaration[0].loc.start);
            }
            if (declaration[0].type !== token_type_1.TokenType.IDENTIFIER) {
                throw new ParserError.GenericSyntaxError(this.source, declaration[0].pos);
            }
            // Safe to cast as we have determined that the token is an identifier.
            declaredVariables.push(this.evaluateToken(declaration[0]));
            // Safe to cast as the "true" flag guarantees an expression.
            declaredValues.push(this.evaluate(declaration[1], true));
        }
        const body = [];
        let definitions = true;
        for (let i = 2; i < tokens.length; i++) {
            if (tokens[i] instanceof tokenizer_1.Token ||
                tokens[i].unwrap()[0] instanceof Group ||
                tokens[i].unwrap()[0].type !== token_type_1.TokenType.DEFINE) {
                // The definitions block is over.
                definitions = false;
                body.push(i < tokens.length - 1
                    ? // Safe to cast as module declarations are only top level.
                        this.wrapInStatement(this.evaluate(tokens[i]))
                    : this.returnStatement(this.evaluate(tokens[i])));
            }
            else {
                if (definitions) {
                    body.push(this.wrapInStatement(this.evaluate(tokens[i])));
                }
                else {
                    // The definitons block is over, and yet there is a define.
                    throw new ParserError.GenericSyntaxError(this.source, tokens[i].unwrap()[0].pos);
                }
            }
        }
        return {
            type: "CallExpression",
            loc: expression.loc,
            callee: {
                type: "ArrowFunctionExpression",
                loc: declaredVariables.length > 0
                    ? {
                        start: declaredVariables[0].loc.start,
                        end: body[body.length - 1].loc.end,
                    }
                    : {
                        start: body[0].loc.start,
                        end: body[body.length - 1].loc.end,
                    },
                params: declaredVariables,
                body: {
                    type: "BlockStatement",
                    loc: {
                        start: body[0].loc.start,
                        end: body[body.length - 1].loc.end,
                    },
                    body: body,
                },
                expression: false,
            },
            arguments: declaredValues,
            optional: false,
        };
    }
    /**
     * Evaluates a conditional expression.
     *
     * @param expression A conditional expression.
     * @returns A conditional expression.
     */
    evaluateCond(expression) {
        const tokens = expression.unwrap();
        if (tokens.length < 2) {
            throw new ParserError.GenericSyntaxError(this.source, tokens[0].pos);
        }
        const clauses = tokens.slice(1);
        const conditions = [];
        const bodies = [];
        let catchAll = {
            type: "Identifier",
            name: "undefined",
        }; // the body of the else clause.
        for (let i = 0; i < clauses.length; i++) {
            const clause = clauses[i];
            if (clause instanceof Group) {
                // Verify that the clause is not empty.
                if (clause.length() < 1) {
                    throw new ParserError.GenericSyntaxError(this.source, clause.loc.start);
                }
                // Check if this is an else clause.
                const clauseTokens = clause.unwrap();
                if (clauseTokens[0] instanceof tokenizer_1.Token &&
                    clauseTokens[0].type === token_type_1.TokenType.ELSE) {
                    if (i < clauses.length - 1) {
                        throw new ParserError.GenericSyntaxError(this.source, clauseTokens[0].pos);
                    }
                    if (clause.length() < 2) {
                        throw new ParserError.GenericSyntaxError(this.source, clauseTokens[0].pos);
                    }
                    catchAll = this.evaluateBody(clauseTokens.slice(1));
                }
                else {
                    const test_val = this.evaluate(clauseTokens[0], true);
                    // Convert JavaScript's truthy/falsy values to Scheme's true/false.
                    const test = {
                        type: "CallExpression",
                        loc: test_val.loc,
                        callee: {
                            type: "Identifier",
                            loc: test_val.loc,
                            name: "$true",
                        },
                        arguments: [test_val],
                    };
                    conditions.push(test);
                    bodies.push(clause.length() < 2
                        ? test_val
                        : this.evaluateBody(clauseTokens.slice(1)));
                    catchAll.loc = bodies[bodies.length - 1].loc;
                    catchAll.loc.start = catchAll.loc.end;
                }
            }
            else {
                throw new ParserError.GenericSyntaxError(this.source, clause.pos);
            }
        }
        let finalConditionalExpression = catchAll;
        for (let i = conditions.length - 1; i >= 0; i--) {
            finalConditionalExpression = {
                type: "ConditionalExpression",
                loc: {
                    start: conditions[i].loc.start,
                    end: finalConditionalExpression.loc.end,
                },
                test: conditions[i],
                consequent: bodies[i],
                alternate: finalConditionalExpression,
            };
        }
        // Wrap the last conditional expression with the expression location.
        finalConditionalExpression.loc = expression.loc;
        // There is at least one conditional expression.
        // This cast is safe.
        return finalConditionalExpression;
    }
    evaluateQuote(expression, quasiquote) {
        const tokens = expression.unwrap();
        if (tokens.length !== 2) {
            throw new ParserError.GenericSyntaxError(this.source, tokens[0].pos);
        }
        if (quasiquote === undefined) {
            quasiquote = tokens[0].type === token_type_1.TokenType.QUASIQUOTE;
        }
        const quotedVal = this.quote(tokens[1], quasiquote);
        // Sanitize location information.
        quotedVal.loc = expression.loc;
        return quotedVal;
    }
    /**
     * Quote prevents evaluation of an expression, leaving it as itself/a list.
     *
     * @param expression An expression to quote.
     * @param quasiquote Whether or not this is a quasiquote.
     * @returns An expression.
     */
    quote(expression, quasiquote) {
        if (expression instanceof tokenizer_1.Token) {
            switch (expression.type) {
                case token_type_1.TokenType.NUMBER:
                case token_type_1.TokenType.STRING:
                case token_type_1.TokenType.BOOLEAN:
                    // Literals
                    return this.evaluateToken(expression);
                default:
                    // Everything else
                    return this.symbol(expression);
            }
        }
        // Array
        // Empty list
        if (expression.length() < 1) {
            const null_list = this.list([]);
            null_list.loc = expression.loc;
            return null_list;
        }
        // Not an empty list
        const tokens = expression.unwrap();
        if (tokens[0] instanceof tokenizer_1.Token &&
            tokens[0].type === token_type_1.TokenType.UNQUOTE &&
            quasiquote) {
            // "Unquote" the expression.
            // It MUST be an expression.
            return this.evaluate(tokens[1], true);
        }
        // Determines whether the quote is parsing a list or a pair.
        let dot;
        const listElements1 = [];
        let listTerminator = null;
        for (let i = 0; i < tokens.length; i++) {
            if (tokens[i] instanceof tokenizer_1.Token &&
                tokens[i].type === token_type_1.TokenType.DOT) {
                if (dot !== undefined) {
                    throw new ParserError.GenericSyntaxError(this.source, tokens[i].pos);
                }
                else {
                    dot = tokens[i];
                }
            }
            else {
                if (dot !== undefined) {
                    // There should only be one element after the dot.
                    if (listTerminator !== null) {
                        throw new ParserError.GenericSyntaxError(this.source, tokens[i].pos);
                    }
                    else {
                        listTerminator = this.quote(tokens[i], quasiquote);
                    }
                }
                else {
                    listElements1.push(this.quote(tokens[i], quasiquote));
                }
            }
        }
        if (dot !== undefined) {
            if (listTerminator === null) {
                throw new ParserError.GenericSyntaxError(this.source, dot.pos);
            }
            // Safe, as we have already determined that listTerminator exists
            if (listElements1.length < 1) {
                return listTerminator;
            }
            return this.dottedList(listElements1, listTerminator);
        }
        return this.list(listElements1);
    }
    /**
     * Converts any non-literal into a Symbol representing their
     * name.
     *
     * @param token A token.
     * @returns A call to string->symbol.
     */
    symbol(token) {
        const loc = this.toSourceLocation(token);
        return {
            type: "CallExpression",
            loc: loc,
            callee: {
                type: "Identifier",
                loc: loc,
                name: "string->symbol",
            },
            arguments: [
                {
                    type: "Literal",
                    loc: loc,
                    value: token.lexeme,
                    raw: `"${token.lexeme}"`,
                },
            ],
            optional: false,
        };
    }
    /**
     * Creates a pair from two expressions.
     *
     * @param car The car of the pair.
     * @param cdr The cdr of the pair.
     * @returns A call to cons.
     */
    pair(car, cdr) {
        return {
            type: "CallExpression",
            loc: {
                start: car.loc.start,
                end: cdr.loc.end,
            },
            callee: {
                type: "Identifier",
                loc: {
                    start: car.loc.start,
                    end: cdr.loc.end,
                },
                name: "cons",
            },
            arguments: [car, cdr],
            optional: false,
        };
    }
    /**
     * Creates a dotted list from a list and a final element.
     *
     * @param cars The list of elements before the terminator.
     * @param cdr The final element.
     * @returns A dotted list.
     */
    dottedList(cars, cdr) {
        let acc = cdr;
        for (let i = cars.length - 1; i >= 0; i--) {
            acc = this.pair(cars[i], acc);
        }
        // Safe to cast. cars is never empty.
        return acc;
    }
    /**
     * Converts an array of Expressions into a list.
     */
    list(expressions) {
        return {
            type: "CallExpression",
            loc: expressions.length > 0
                ? {
                    start: expressions[0].loc.start,
                    end: expressions[expressions.length - 1].loc.end,
                }
                : undefined,
            callee: {
                type: "Identifier",
                loc: expressions.length > 0
                    ? {
                        start: expressions[0].loc.start,
                        end: expressions[expressions.length - 1].loc.end,
                    }
                    : undefined,
                name: "list",
            },
            arguments: expressions,
            optional: false,
        };
    }
    /**
     * Evaluates a set expression.
     * Direct equivalent to AssignmentExpression.
     * !!! R7RS STATES THAT THE RETURN VALUE OF SET! IS UNSPECIFIED.
     * !!! THIS IMPLEMENTATION RETURNS THE VALUE OF THE ASSIGNMENT.
     *
     * @param expression A token.
     * @returns An assignment axpression.
     */
    evaluateSet(expression) {
        const tokens = expression.unwrap();
        if (tokens.length !== 3) {
            throw new ParserError.GenericSyntaxError(this.source, tokens[0].pos);
        }
        if (!(tokens[1] instanceof tokenizer_1.Token)) {
            throw new ParserError.GenericSyntaxError(this.source, tokens[1].loc.start);
        }
        else if (tokens[1].type !== token_type_1.TokenType.IDENTIFIER) {
            throw new ParserError.GenericSyntaxError(this.source, tokens[1].pos);
        }
        // Safe to cast as we have predetermined that it is an identifier.
        const identifier = this.evaluateToken(tokens[1]);
        const newValue = this.evaluate(tokens[2]);
        return {
            type: "AssignmentExpression",
            loc: expression.loc,
            operator: "=",
            left: identifier,
            right: newValue,
        };
    }
    /**
     * Evaluates a begin expression.
     * Also evaluates implicit begins.
     *
     * @param expression A begin expression.
     * @returns An expression.
     */
    evaluateBegin(expression) {
        const beginBody = this.evaluateBody(expression.unwrap().slice(1));
        beginBody.loc = expression.loc;
        return beginBody;
    }
    /**
     * Evaluates a body expression
     * Equivalent to evaluating a JavaScript block statement,
     * except this returns a value too.
     *
     * @param tokens An array of expressions.
     * @returns An Immediately Invoked Function Expression (IIFE).
     */
    evaluateBody(tokens) {
        const body = [];
        let definitions = true;
        for (let i = 0; i < tokens.length; i++) {
            if (tokens[i] instanceof tokenizer_1.Token ||
                tokens[i].unwrap()[0] instanceof Group ||
                tokens[i].unwrap()[0].type !== token_type_1.TokenType.DEFINE) {
                // The definitions block is over.
                definitions = false;
                body.push(i < tokens.length - 1
                    ? // Safe to cast as module declarations are only top level.
                        this.wrapInStatement(this.evaluate(tokens[i]))
                    : this.returnStatement(this.evaluate(tokens[i])));
            }
            else {
                if (definitions) {
                    body.push(this.wrapInStatement(this.evaluate(tokens[i])));
                }
                else {
                    // The definitions block is over, and yet there is a define.
                    throw new ParserError.GenericSyntaxError(this.source, tokens[i].unwrap()[0].pos);
                }
            }
        }
        return {
            type: "CallExpression",
            loc: body[0] !== undefined
                ? {
                    start: body[0].loc.start,
                    end: body[body.length - 1].loc.end,
                }
                : undefined,
            callee: {
                type: "ArrowFunctionExpression",
                loc: body[0] !== undefined
                    ? {
                        start: body[0].loc.start,
                        end: body[body.length - 1].loc.end,
                    }
                    : undefined,
                params: [],
                body: {
                    type: "BlockStatement",
                    loc: body[0] !== undefined
                        ? {
                            start: body[0].loc.start,
                            end: body[body.length - 1].loc.end,
                        }
                        : undefined,
                    body: body,
                },
                expression: false,
            },
            arguments: [],
            optional: false,
        };
    }
    /**
     * Evaluates a delay procedure call.
     *
     * @param expression A delay procedure call in Scheme.
     * @returns A lambda function that takes no arguments and returns the delayed expression.
     */
    evaluateDelay(expression) {
        const tokens = expression.unwrap();
        if (tokens.length !== 2) {
            throw new ParserError.GenericSyntaxError(this.source, tokens[0].pos);
        }
        const delayed = this.returnStatement(this.evaluate(tokens[1], true));
        return {
            type: "ArrowFunctionExpression",
            loc: expression.loc,
            params: [],
            body: {
                type: "BlockStatement",
                loc: delayed.loc,
                body: [delayed],
            },
            expression: false,
        };
    }
    /**
     * Evaluates an import statement.
     * Special syntax for importing modules, using a similar syntax to JS.
     * (import "module-name" (imported-name1 imported-name2 ...))
     *
     * @param expression An import statement in Scheme.
     * @returns An import statement in estree form.
     */
    evaluateImport(expression) {
        const tokens = expression.unwrap();
        if (tokens.length < 3) {
            throw new ParserError.GenericSyntaxError(this.source, tokens[0].pos);
        }
        else if (!(tokens[1] instanceof tokenizer_1.Token)) {
            throw new ParserError.GenericSyntaxError(this.source, tokens[1].loc.start);
        }
        else if (tokens[1].type !== token_type_1.TokenType.STRING) {
            throw new ParserError.GenericSyntaxError(this.source, tokens[1].pos);
        }
        else if (!(tokens[2] instanceof Group)) {
            throw new ParserError.GenericSyntaxError(this.source, tokens[2].pos);
        }
        const specifiers = [];
        const specifierTokens = tokens[2].unwrap();
        for (let i = 0; i < specifierTokens.length; i++) {
            if (!(specifierTokens[i] instanceof tokenizer_1.Token)) {
                throw new ParserError.GenericSyntaxError(this.source, specifierTokens[i].loc.start);
            }
            else if (specifierTokens[i].type !== token_type_1.TokenType.IDENTIFIER) {
                throw new ParserError.GenericSyntaxError(this.source, specifierTokens[i].pos);
            }
            specifiers.push({
                type: "ImportSpecifier",
                local: this.evaluate(specifierTokens[i]),
                imported: this.evaluate(specifierTokens[i]),
                loc: this.toSourceLocation(specifierTokens[i]),
            });
        }
        return {
            type: "ImportDeclaration",
            specifiers: specifiers,
            source: this.evaluate(tokens[1]),
            loc: expression.loc,
        };
    }
    /**
     * Evaluates an export statement.
     * Similar syntax to JS, wherein export "wraps" around a declaration.
     *
     * (export (define ...))
     * @param expression An export statement in Scheme.
     * @returns An export statement in estree form.
     */
    evaluateExport(expression) {
        const tokens = expression.unwrap();
        if (tokens.length !== 2) {
            throw new ParserError.GenericSyntaxError(this.source, tokens[0].pos);
        }
        if (!(tokens[1] instanceof Group)) {
            throw new ParserError.GenericSyntaxError(this.source, tokens[1].pos);
        }
        const exportTokens = tokens[1].unwrap();
        if (!(exportTokens[0] instanceof tokenizer_1.Token)) {
            throw new ParserError.GenericSyntaxError(this.source, exportTokens[0].loc.start);
        }
        if (exportTokens[0].type !== token_type_1.TokenType.DEFINE) {
            throw new ParserError.GenericSyntaxError(this.source, tokens[0].pos);
        }
        const declaration = this.evaluate(tokens[1]);
        return {
            type: "ExportNamedDeclaration",
            declaration: declaration,
            specifiers: [],
            source: null,
            loc: expression.loc,
        };
    }
    /**
     * Evaluates an application.
     * An application is a function call.
     *
     * @param expression An expression.
     * @returns A call expression.
     */
    evaluateApplication(expression) {
        const tokens = expression.unwrap();
        const procedure = this.evaluate(tokens[0]);
        const args = tokens.slice(1).map((arg) => this.evaluate(arg, true));
        return {
            type: "CallExpression",
            loc: expression.loc,
            callee: procedure,
            arguments: args,
            //predetermined that the arguments are expressions.
            optional: false,
        };
    }
    /**
     * Evaluates a token.
     *
     * @param token A token, which should be an expression.
     *              Either a literal or an identifier.
     * @returns An expression.
     * @throws ParserError.UnexpectedTokenError
     */
    evaluateToken(token) {
        switch (token.type) {
            case token_type_1.TokenType.NUMBER:
            case token_type_1.TokenType.BOOLEAN:
            case token_type_1.TokenType.STRING:
                return {
                    type: "Literal",
                    value: token.literal,
                    raw: token.type === token_type_1.TokenType.BOOLEAN
                        ? token.literal
                            ? "true"
                            : "false"
                        : token.lexeme,
                    loc: this.toSourceLocation(token),
                };
            case token_type_1.TokenType.IDENTIFIER:
                return {
                    type: "Identifier",
                    name: token.lexeme,
                    loc: this.toSourceLocation(token),
                };
            default:
                throw new ParserError.UnexpectedTokenError(this.source, token.pos, token);
        }
    }
    /**
     * Wraps a node in a statement if necessary.
     *
     * @param expression An expression.
     * @returns A statement.
     */
    wrapInStatement(expression) {
        if (this.isExpression(expression)) {
            return {
                type: "ExpressionStatement",
                expression: expression,
                loc: expression.loc,
            };
        }
        return expression;
    }
    /**
     * Turns a value into a return statement.
     *
     * @param expression An expression.
     * @returns A statement.
     */
    returnStatement(expression) {
        if (this.isExpression(expression)) {
            // Return the expression wrapped in a return statement.
            return {
                type: "ReturnStatement",
                argument: expression,
                loc: expression.loc,
            };
        }
        // If the expression is not a expression, just return the statement.
        return expression;
    }
    /**
     * Typeguard to determine if a node is an expression.
     *
     * @param maybeExpression A node.
     * @returns True if the node is an expression.
     */
    isExpression(maybeStatement) {
        return (!maybeStatement.type.includes("Statement") &&
            !maybeStatement.type.includes("Declaration"));
    }
    /**
     * Evaluates the proper sourceLocation for an expression.
     * @returns The sourceLocation for an expression.
     */
    toSourceLocation(startToken, endToken = startToken) {
        return {
            start: startToken.pos,
            end: endToken.pos,
        };
    }
    parse() {
        while (!this.isAtEnd()) {
            let currentStatement = this.grouping();
            // Unwrap the grouping.
            // Top-level grouping always contains
            // one internal item of type Token or Group.
            // This is what we want to work on.
            let currentGroup = currentStatement.unwrap()[0];
            if (currentGroup instanceof Group ||
                currentGroup.type !== token_type_1.TokenType.EOF) {
                this.estree.body.push(this.wrapInStatement(this.evaluate(currentGroup, false, true)));
            }
        }
        return this.estree;
    }
}
exports.Parser = Parser;
//# sourceMappingURL=parser.js.map