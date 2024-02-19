import { Position } from "estree";
export declare abstract class TokenizerError extends SyntaxError {
    loc: Position;
    constructor(message: string, line: number, col: number);
    toString(): string;
}
export declare class UnexpectedCharacterError extends TokenizerError {
    char: string;
    constructor(line: number, col: number, char: string);
}
export declare class UnexpectedEOFError extends TokenizerError {
    constructor(line: number, col: number);
}
