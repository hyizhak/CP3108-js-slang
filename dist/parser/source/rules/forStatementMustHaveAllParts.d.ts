import * as es from 'estree';
import { ErrorSeverity, ErrorType, Rule, SourceError } from '../../../types';
export declare class ForStatmentMustHaveAllParts implements SourceError {
    node: es.ForStatement;
    private missingParts;
    type: ErrorType;
    severity: ErrorSeverity;
    constructor(node: es.ForStatement, missingParts: string[]);
    get location(): es.SourceLocation;
    explain(): string;
    elaborate(): string;
}
declare const forStatementMustHaveAllParts: Rule<es.ForStatement>;
export default forStatementMustHaveAllParts;
