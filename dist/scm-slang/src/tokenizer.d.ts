import { TokenType } from "./token-type";
import { Position } from "estree";
export declare class Token {
    type: TokenType;
    lexeme: string;
    literal: any;
    start: number;
    end: number;
    pos: Position;
    constructor(type: TokenType, lexeme: any, literal: any, start: number, end: number, line: number, col: number);
    toString(): string;
}
export declare class Tokenizer {
    private readonly source;
    private readonly tokens;
    private start;
    private current;
    private line;
    private col;
    constructor(source: string);
    private isAtEnd;
    private advance;
    private jump;
    private addToken;
    scanTokens(): Token[];
    private scanToken;
    private comment;
    private identifierToken;
    private identifierTokenLoose;
    private identifierNumberToken;
    private checkKeyword;
    private stringToken;
    private booleanToken;
    private match;
    private peek;
    private peekNext;
    private peekPrev;
    private isDigit;
    private isSpecialSyntax;
    private isValidIdentifier;
    private isWhitespace;
}
