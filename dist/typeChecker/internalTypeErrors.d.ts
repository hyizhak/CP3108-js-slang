import * as es from 'estree';
import { ErrorSeverity, ErrorType, NodeWithInferredType, SourceError, Type } from '../types';
import * as tsEs from './tsESTree';
export declare class TypeError implements SourceError {
    node: NodeWithInferredType<es.Node>;
    message: string;
    type: ErrorType;
    severity: ErrorSeverity;
    constructor(node: NodeWithInferredType<es.Node>, message: string);
    get location(): es.SourceLocation;
    explain(): string;
    elaborate(): string;
}
/**
 * Temporary error that will eventually be converted to TypeError as some errors are only thrown
 * where there is no handle to the node
 */
export declare class InternalTypeError extends Error {
    message: string;
    constructor(message: string);
}
export declare class UnifyError extends InternalTypeError {
    LHS: Type;
    RHS: Type;
    constructor(LHS: Type, RHS: Type);
}
export declare class InternalDifferentNumberArgumentsError extends InternalTypeError {
    numExpectedArgs: number;
    numReceived: number;
    constructor(numExpectedArgs: number, numReceived: number);
}
export declare class InternalCyclicReferenceError extends InternalTypeError {
    name: string;
    constructor(name: string);
}
export declare class TypecheckError implements SourceError {
    node: tsEs.Node | tsEs.TSType;
    message: string;
    type: ErrorType;
    severity: ErrorSeverity;
    constructor(node: tsEs.Node | tsEs.TSType, message: string);
    get location(): es.SourceLocation;
    explain(): string;
    elaborate(): string;
}
