import * as es from 'estree';
import { ErrorSeverity, ErrorType, Rule, SourceError } from '../../../types';
export declare class NoUpdateAssignment implements SourceError {
    node: es.AssignmentExpression;
    type: ErrorType;
    severity: ErrorSeverity;
    constructor(node: es.AssignmentExpression);
    get location(): es.SourceLocation;
    explain(): string;
    elaborate(): string;
}
declare const noUpdateAssignment: Rule<es.AssignmentExpression>;
export default noUpdateAssignment;
