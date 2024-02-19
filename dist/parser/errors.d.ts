import { Node, SourceLocation } from 'estree';
import { ErrorSeverity, ErrorType, SourceError } from '../types';
export declare class MissingSemicolonError implements SourceError {
    location: SourceLocation;
    type: ErrorType;
    severity: ErrorSeverity;
    constructor(location: SourceLocation);
    explain(): string;
    elaborate(): string;
}
export declare class TrailingCommaError implements SourceError {
    location: SourceLocation;
    type: ErrorType.SYNTAX;
    severity: ErrorSeverity.WARNING;
    constructor(location: SourceLocation);
    explain(): string;
    elaborate(): string;
}
export declare class FatalSyntaxError implements SourceError {
    location: SourceLocation;
    message: string;
    type: ErrorType;
    severity: ErrorSeverity;
    constructor(location: SourceLocation, message: string);
    explain(): string;
    elaborate(): string;
}
export declare class DisallowedConstructError implements SourceError {
    node: Node;
    type: ErrorType;
    severity: ErrorSeverity;
    nodeType: string;
    constructor(node: Node);
    get location(): SourceLocation;
    explain(): string;
    elaborate(): string;
    /**
     * Converts estree node.type into english
     * e.g. ThisExpression -> 'this' expressions
     *      Property -> Properties
     *      EmptyStatement -> Empty Statements
     */
    private formatNodeType;
}
