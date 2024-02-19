import * as es from 'estree';
import * as tsEs from '../typeChecker/tsESTree';
import { ErrorSeverity, ErrorType, NodeWithInferredType, SArray, SourceError, Type } from '../types';
export declare class InvalidArrayIndexType implements SourceError {
    node: NodeWithInferredType<es.Node>;
    receivedType: Type;
    type: ErrorType;
    severity: ErrorSeverity;
    constructor(node: NodeWithInferredType<es.Node>, receivedType: Type);
    get location(): es.SourceLocation;
    explain(): string;
    elaborate(): string;
}
export declare class ArrayAssignmentError implements SourceError {
    node: NodeWithInferredType<es.Node>;
    arrayType: SArray;
    receivedType: SArray;
    type: ErrorType;
    severity: ErrorSeverity;
    constructor(node: NodeWithInferredType<es.Node>, arrayType: SArray, receivedType: SArray);
    get location(): es.SourceLocation;
    explain(): string;
    elaborate(): string;
}
export declare class ReassignConstError implements SourceError {
    node: NodeWithInferredType<es.AssignmentExpression>;
    type: ErrorType;
    severity: ErrorSeverity;
    constructor(node: NodeWithInferredType<es.AssignmentExpression>);
    get location(): es.SourceLocation;
    explain(): string;
    elaborate(): string;
}
export declare class DifferentAssignmentError implements SourceError {
    node: NodeWithInferredType<es.AssignmentExpression>;
    expectedType: Type;
    receivedType: Type;
    type: ErrorType;
    severity: ErrorSeverity;
    constructor(node: NodeWithInferredType<es.AssignmentExpression>, expectedType: Type, receivedType: Type);
    get location(): es.SourceLocation;
    explain(): string;
    elaborate(): string;
}
export declare class CyclicReferenceError implements SourceError {
    node: NodeWithInferredType<es.Node>;
    type: ErrorType;
    severity: ErrorSeverity;
    constructor(node: NodeWithInferredType<es.Node>);
    get location(): es.SourceLocation;
    explain(): string;
    elaborate(): string;
}
export declare class DifferentNumberArgumentsError implements SourceError {
    node: NodeWithInferredType<es.Node>;
    numExpectedArgs: number;
    numReceived: number;
    type: ErrorType;
    severity: ErrorSeverity;
    constructor(node: NodeWithInferredType<es.Node>, numExpectedArgs: number, numReceived: number);
    get location(): es.SourceLocation;
    explain(): string;
    elaborate(): string;
}
export declare class InvalidArgumentTypesError implements SourceError {
    node: NodeWithInferredType<es.Node>;
    args: NodeWithInferredType<es.Node>[];
    expectedTypes: Type[];
    receivedTypes: Type[];
    type: ErrorType;
    severity: ErrorSeverity;
    constructor(node: NodeWithInferredType<es.Node>, args: NodeWithInferredType<es.Node>[], expectedTypes: Type[], receivedTypes: Type[]);
    get location(): es.SourceLocation;
    explain(): string;
    elaborate(): string;
}
export declare class InvalidTestConditionError implements SourceError {
    node: NodeWithInferredType<es.IfStatement | es.ConditionalExpression | es.WhileStatement | es.ForStatement>;
    receivedType: Type;
    type: ErrorType;
    severity: ErrorSeverity;
    constructor(node: NodeWithInferredType<es.IfStatement | es.ConditionalExpression | es.WhileStatement | es.ForStatement>, receivedType: Type);
    get location(): es.SourceLocation;
    explain(): string;
    elaborate(): string;
}
export declare class UndefinedIdentifierError implements SourceError {
    node: NodeWithInferredType<es.Identifier>;
    name: string;
    type: ErrorType;
    severity: ErrorSeverity;
    constructor(node: NodeWithInferredType<es.Identifier>, name: string);
    get location(): es.SourceLocation;
    explain(): string;
    elaborate(): string;
}
export declare class ConsequentAlternateMismatchError implements SourceError {
    node: NodeWithInferredType<es.IfStatement | es.ConditionalExpression>;
    consequentType: Type;
    alternateType: Type;
    type: ErrorType;
    severity: ErrorSeverity;
    constructor(node: NodeWithInferredType<es.IfStatement | es.ConditionalExpression>, consequentType: Type, alternateType: Type);
    get location(): es.SourceLocation;
    explain(): string;
    elaborate(): string;
}
export declare class CallingNonFunctionType implements SourceError {
    node: NodeWithInferredType<es.CallExpression>;
    callerType: Type;
    type: ErrorType;
    severity: ErrorSeverity;
    constructor(node: NodeWithInferredType<es.CallExpression>, callerType: Type);
    get location(): es.SourceLocation;
    explain(): string;
    elaborate(): string;
}
export declare class InconsistentPredicateTestError implements SourceError {
    node: NodeWithInferredType<es.CallExpression>;
    argVarName: string;
    preUnifyType: Type;
    predicateType: Type;
    type: ErrorType;
    severity: ErrorSeverity;
    constructor(node: NodeWithInferredType<es.CallExpression>, argVarName: string, preUnifyType: Type, predicateType: Type);
    get location(): es.SourceLocation;
    explain(): string;
    elaborate(): string;
}
export declare class TypeMismatchError implements SourceError {
    node: tsEs.Node;
    actualTypeString: string;
    expectedTypeString: string;
    type: ErrorType;
    severity: ErrorSeverity;
    constructor(node: tsEs.Node, actualTypeString: string, expectedTypeString: string);
    get location(): es.SourceLocation;
    explain(): string;
    elaborate(): string;
}
export declare class TypeNotFoundError implements SourceError {
    node: tsEs.Node;
    name: string;
    type: ErrorType;
    severity: ErrorSeverity;
    constructor(node: tsEs.Node, name: string);
    get location(): es.SourceLocation;
    explain(): string;
    elaborate(): string;
}
export declare class FunctionShouldHaveReturnValueError implements SourceError {
    node: tsEs.FunctionDeclaration | tsEs.ArrowFunctionExpression;
    type: ErrorType;
    severity: ErrorSeverity;
    constructor(node: tsEs.FunctionDeclaration | tsEs.ArrowFunctionExpression);
    get location(): es.SourceLocation;
    explain(): string;
    elaborate(): string;
}
export declare class TypeNotCallableError implements SourceError {
    node: tsEs.CallExpression;
    typeName: string;
    type: ErrorType;
    severity: ErrorSeverity;
    constructor(node: tsEs.CallExpression, typeName: string);
    get location(): es.SourceLocation;
    explain(): string;
    elaborate(): string;
}
export declare class TypecastError implements SourceError {
    node: tsEs.TSAsExpression;
    originalType: string;
    typeToCastTo: string;
    type: ErrorType;
    severity: ErrorSeverity;
    constructor(node: tsEs.TSAsExpression, originalType: string, typeToCastTo: string);
    get location(): es.SourceLocation;
    explain(): string;
    elaborate(): string;
}
export declare class TypeNotAllowedError implements SourceError {
    node: tsEs.TSType;
    name: string;
    type: ErrorType;
    severity: ErrorSeverity;
    constructor(node: tsEs.TSType, name: string);
    get location(): es.SourceLocation;
    explain(): string;
    elaborate(): string;
}
export declare class UndefinedVariableTypeError implements SourceError {
    node: tsEs.Node;
    name: string;
    type: ErrorType;
    severity: ErrorSeverity;
    constructor(node: tsEs.Node, name: string);
    get location(): es.SourceLocation;
    explain(): string;
    elaborate(): string;
}
export declare class InvalidNumberOfArgumentsTypeError implements SourceError {
    node: tsEs.CallExpression;
    expected: number;
    got: number;
    hasVarArgs: boolean;
    type: ErrorType;
    severity: ErrorSeverity;
    calleeStr: string;
    constructor(node: tsEs.CallExpression, expected: number, got: number, hasVarArgs?: boolean);
    get location(): es.SourceLocation;
    explain(): string;
    elaborate(): string;
}
export declare class InvalidNumberOfTypeArgumentsForGenericTypeError implements SourceError {
    node: tsEs.Node;
    name: string;
    expected: number;
    type: ErrorType;
    severity: ErrorSeverity;
    constructor(node: tsEs.Node, name: string, expected: number);
    get location(): es.SourceLocation;
    explain(): string;
    elaborate(): string;
}
export declare class TypeNotGenericError implements SourceError {
    node: tsEs.Node;
    name: string;
    type: ErrorType;
    severity: ErrorSeverity;
    constructor(node: tsEs.Node, name: string);
    get location(): es.SourceLocation;
    explain(): string;
    elaborate(): string;
}
export declare class TypeAliasNameNotAllowedError implements SourceError {
    node: tsEs.TSTypeAliasDeclaration;
    name: string;
    type: ErrorType;
    severity: ErrorSeverity;
    constructor(node: tsEs.TSTypeAliasDeclaration, name: string);
    get location(): es.SourceLocation;
    explain(): string;
    elaborate(): string;
}
export declare class TypeParameterNameNotAllowedError implements SourceError {
    node: tsEs.TSTypeParameter;
    name: string;
    type: ErrorType;
    severity: ErrorSeverity;
    constructor(node: tsEs.TSTypeParameter, name: string);
    get location(): es.SourceLocation;
    explain(): string;
    elaborate(): string;
}
export declare class InvalidIndexTypeError implements SourceError {
    node: tsEs.MemberExpression;
    typeName: string;
    type: ErrorType;
    severity: ErrorSeverity;
    constructor(node: tsEs.MemberExpression, typeName: string);
    get location(): es.SourceLocation;
    explain(): string;
    elaborate(): string;
}
export declare class InvalidArrayAccessTypeError implements SourceError {
    node: tsEs.MemberExpression;
    typeName: string;
    type: ErrorType;
    severity: ErrorSeverity;
    constructor(node: tsEs.MemberExpression, typeName: string);
    get location(): es.SourceLocation;
    explain(): string;
    elaborate(): string;
}
export declare class ConstNotAssignableTypeError implements SourceError {
    node: tsEs.AssignmentExpression;
    name: string;
    type: ErrorType;
    severity: ErrorSeverity;
    constructor(node: tsEs.AssignmentExpression, name: string);
    get location(): es.SourceLocation;
    explain(): string;
    elaborate(): string;
}
export declare class DuplicateTypeAliasError implements SourceError {
    node: tsEs.TSTypeAliasDeclaration;
    name: string;
    type: ErrorType;
    severity: ErrorSeverity;
    constructor(node: tsEs.TSTypeAliasDeclaration, name: string);
    get location(): es.SourceLocation;
    explain(): string;
    elaborate(): string;
}
