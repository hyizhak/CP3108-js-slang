import * as es from 'estree';
import { ErrorSeverity, ErrorType, Rule, SourceError } from '../../../types';
export declare class NoHolesInArrays implements SourceError {
    node: es.ArrayExpression;
    type: ErrorType;
    severity: ErrorSeverity;
    constructor(node: es.ArrayExpression);
    get location(): es.SourceLocation;
    explain(): string;
    elaborate(): string;
}
declare const noHolesInArrays: Rule<es.ArrayExpression>;
export default noHolesInArrays;
