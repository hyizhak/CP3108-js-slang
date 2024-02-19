import * as es from 'estree';
import { RuntimeSourceError } from '../errors/runtimeSourceError';
import { Chapter, ErrorSeverity, ErrorType, Value } from '../types';
export declare class TypeError extends RuntimeSourceError {
    side: string;
    expected: string;
    got: string;
    chapter: Chapter;
    type: ErrorType;
    severity: ErrorSeverity;
    location: es.SourceLocation;
    constructor(node: es.Node, side: string, expected: string, got: string, chapter?: Chapter);
    explain(): string;
    elaborate(): string;
}
export declare const checkUnaryExpression: (node: es.Node, operator: es.UnaryOperator, value: Value, chapter?: Chapter) => TypeError | undefined;
export declare const checkBinaryExpression: (node: es.Node, operator: es.BinaryOperator, chapter: Chapter, left: Value, right: Value) => TypeError | undefined;
export declare const checkIfStatement: (node: es.Node, test: Value, chapter?: Chapter) => TypeError | undefined;
export declare const checkMemberAccess: (node: es.Node, obj: Value, prop: Value) => TypeError | undefined;
export declare const isIdentifier: (node: any) => node is es.Identifier;
