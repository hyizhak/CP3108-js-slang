import { Token } from "./tokenizer";
import { Program } from "estree";
export declare class Parser {
    private readonly source;
    private readonly tokens;
    private readonly estree;
    private readonly chapter;
    private current;
    constructor(source: string, tokens: Token[], chapter?: number);
    private advance;
    private isAtEnd;
    private previous;
    private validateChapter;
    /**
     * Returns a group of associated tokens.
     * Tokens are grouped by level of parentheses.
     *
     * @param openparen The type of opening parenthesis.
     * @returns A group of tokens or groups of tokens.
     */
    private grouping;
    /**
     * Compares the type of opening and closing parantheses.
     *
     * @param lParen
     * @param rParen
     * @returns Whether the parentheses match.
     */
    private matchingParentheses;
    /**
     * Converts a token to another representation of itself.
     *
     * @param token A token to be converted.
     * @returns A converted token.
     */
    private convertToken;
    /**
     * Evaluates a group of tokens.
     *
     * @param expression An expression.
     * @param onlyExpressions Option to force expressions.
     * @param topLevel Whether the expression is top level.
     * @returns An evaluated expression.
     */
    private evaluate;
    /**
     * Evaluates a definition statement.
     *
     * @param statement A definition statement.
     */
    private evaluateDefine;
    /**
     * Evaluates an if statement.
     *
     * @param expression An if expression.
     * @returns A conditional expression.
     */
    private evaluateIf;
    /**
     * Evaluates a lambda expression.
     *
     * @param expression A lambda expression.
     * @returns A function expression.
     */
    private evaluateLambda;
    /**
     * Evaluates a let expression.
     * let is syntactic sugar for an invoked lambda procedure.
     *
     * @param expression A let expression.
     * @returns An IIFE.
     */
    private evaluateLet;
    /**
     * Evaluates a conditional expression.
     *
     * @param expression A conditional expression.
     * @returns A conditional expression.
     */
    private evaluateCond;
    /**
     * Evaluates a quote statement.
     *
     * @param expression A quote statement.
     * @returns An expression. Can be a Literal, NewExpression
     */
    private evaluateQuote;
    /**
     * Quote prevents evaluation of an expression, leaving it as itself/a list.
     *
     * @param expression An expression to quote.
     * @param quasiquote Whether or not this is a quasiquote.
     * @returns An expression.
     */
    private quote;
    /**
     * Converts any non-literal into a Symbol representing their
     * name.
     *
     * @param token A token.
     * @returns A call to string->symbol.
     */
    private symbol;
    /**
     * Creates a pair from two expressions.
     *
     * @param car The car of the pair.
     * @param cdr The cdr of the pair.
     * @returns A call to cons.
     */
    private pair;
    /**
     * Creates a dotted list from a list and a final element.
     *
     * @param cars The list of elements before the terminator.
     * @param cdr The final element.
     * @returns A dotted list.
     */
    private dottedList;
    /**
     * Converts an array of Expressions into a list.
     */
    private list;
    /**
     * Evaluates a set expression.
     * Direct equivalent to AssignmentExpression.
     * !!! R7RS STATES THAT THE RETURN VALUE OF SET! IS UNSPECIFIED.
     * !!! THIS IMPLEMENTATION RETURNS THE VALUE OF THE ASSIGNMENT.
     *
     * @param expression A token.
     * @returns An assignment axpression.
     */
    private evaluateSet;
    /**
     * Evaluates a begin expression.
     * Also evaluates implicit begins.
     *
     * @param expression A begin expression.
     * @returns An expression.
     */
    private evaluateBegin;
    /**
     * Evaluates a body expression
     * Equivalent to evaluating a JavaScript block statement,
     * except this returns a value too.
     *
     * @param tokens An array of expressions.
     * @returns An Immediately Invoked Function Expression (IIFE).
     */
    private evaluateBody;
    /**
     * Evaluates a delay procedure call.
     *
     * @param expression A delay procedure call in Scheme.
     * @returns A lambda function that takes no arguments and returns the delayed expression.
     */
    private evaluateDelay;
    /**
     * Evaluates an import statement.
     * Special syntax for importing modules, using a similar syntax to JS.
     * (import "module-name" (imported-name1 imported-name2 ...))
     *
     * @param expression An import statement in Scheme.
     * @returns An import statement in estree form.
     */
    private evaluateImport;
    /**
     * Evaluates an export statement.
     * Similar syntax to JS, wherein export "wraps" around a declaration.
     *
     * (export (define ...))
     * @param expression An export statement in Scheme.
     * @returns An export statement in estree form.
     */
    private evaluateExport;
    /**
     * Evaluates an application.
     * An application is a function call.
     *
     * @param expression An expression.
     * @returns A call expression.
     */
    private evaluateApplication;
    /**
     * Evaluates a token.
     *
     * @param token A token, which should be an expression.
     *              Either a literal or an identifier.
     * @returns An expression.
     * @throws ParserError.UnexpectedTokenError
     */
    private evaluateToken;
    /**
     * Wraps a node in a statement if necessary.
     *
     * @param expression An expression.
     * @returns A statement.
     */
    private wrapInStatement;
    /**
     * Turns a value into a return statement.
     *
     * @param expression An expression.
     * @returns A statement.
     */
    private returnStatement;
    /**
     * Typeguard to determine if a node is an expression.
     *
     * @param maybeExpression A node.
     * @returns True if the node is an expression.
     */
    private isExpression;
    /**
     * Evaluates the proper sourceLocation for an expression.
     * @returns The sourceLocation for an expression.
     */
    private toSourceLocation;
    parse(): Program;
}
