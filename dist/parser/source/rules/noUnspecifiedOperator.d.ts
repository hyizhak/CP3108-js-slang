import * as es from 'estree';
import { ErrorSeverity, ErrorType, Rule, SourceError } from '../../../types';
export declare class NoUnspecifiedOperatorError implements SourceError {
    node: es.BinaryExpression | es.UnaryExpression;
    type: ErrorType;
    severity: ErrorSeverity;
    unspecifiedOperator: string;
    constructor(node: es.BinaryExpression | es.UnaryExpression);
    get location(): es.SourceLocation;
    explain(): string;
    elaborate(): string;
}
declare const noUnspecifiedOperator: Rule<es.BinaryExpression | es.UnaryExpression>;
export default noUnspecifiedOperator;
