import * as es from 'estree';
import { ErrorSeverity, ErrorType, Rule, SourceError } from '../../../types';
export declare class BracesAroundWhileError implements SourceError {
    node: es.WhileStatement;
    type: ErrorType;
    severity: ErrorSeverity;
    constructor(node: es.WhileStatement);
    get location(): es.SourceLocation;
    explain(): string;
    elaborate(): string;
}
declare const bracesAroundWhile: Rule<es.WhileStatement>;
export default bracesAroundWhile;
