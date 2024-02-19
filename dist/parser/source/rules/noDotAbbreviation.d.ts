import * as es from 'estree';
import { ErrorSeverity, ErrorType, Rule, SourceError } from '../../../types';
export declare class NoDotAbbreviationError implements SourceError {
    node: es.MemberExpression;
    type: ErrorType;
    severity: ErrorSeverity;
    constructor(node: es.MemberExpression);
    get location(): es.SourceLocation;
    explain(): string;
    elaborate(): string;
}
declare const noDotAbbreviation: Rule<es.MemberExpression>;
export default noDotAbbreviation;
