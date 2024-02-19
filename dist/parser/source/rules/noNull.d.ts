import * as es from 'estree';
import { ErrorSeverity, ErrorType, Rule, SourceError } from '../../../types';
export declare class NoNullError implements SourceError {
    node: es.Literal;
    type: ErrorType;
    severity: ErrorSeverity;
    constructor(node: es.Literal);
    get location(): es.SourceLocation;
    explain(): string;
    elaborate(): string;
}
declare const noNull: Rule<es.Literal>;
export default noNull;
