import { Token } from "./tokenizer";
import { Position } from "estree";
export declare abstract class ParserError extends SyntaxError {
    loc: Position;
    constructor(message: string, pos: Position);
    toString(): string;
}
export declare class GenericSyntaxError extends ParserError {
    constructor(source: string, pos: Position);
}
export declare class ParenthesisMismatchError extends ParserError {
    constructor(source: string, pos: Position);
}
export declare class UnexpectedEOFError extends ParserError {
    constructor(source: string, pos: Position);
}
export declare class UnexpectedTokenError extends ParserError {
    token: Token;
    constructor(source: string, pos: Position, token: Token);
}
export declare class ExpectedTokenError extends ParserError {
    token: Token;
    expected: string;
    constructor(source: string, pos: Position, token: Token, expected: string);
}
export declare class DisallowedTokenError extends ParserError {
    token: Token;
    constructor(source: string, pos: Position, token: Token, chapter: number);
}
export declare class UnsupportedTokenError extends ParserError {
    token: Token;
    constructor(source: string, pos: Position, token: Token);
}
