import * as es from 'estree';
import { ErrorSeverity, ErrorType, Rule, SourceError } from '../../../types';
export declare class BracesAroundForError implements SourceError {
    node: es.ForStatement;
    type: ErrorType;
    severity: ErrorSeverity;
    constructor(node: es.ForStatement);
    get location(): es.SourceLocation;
    explain(): string;
    elaborate(): string;
}
declare const bracesAroundFor: Rule<es.ForStatement>;
export default bracesAroundFor;
