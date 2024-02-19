import * as es from 'estree';
import { ErrorSeverity, ErrorType, Rule, SourceError } from '../../../types';
export declare class StrictEqualityError implements SourceError {
    node: es.BinaryExpression;
    type: ErrorType;
    severity: ErrorSeverity;
    constructor(node: es.BinaryExpression);
    get location(): es.SourceLocation;
    explain(): "Use === instead of ==" | "Use !== instead of !=";
    elaborate(): string;
}
declare const strictEquality: Rule<es.BinaryExpression>;
export default strictEquality;
