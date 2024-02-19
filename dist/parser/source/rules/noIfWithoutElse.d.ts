import * as es from 'estree';
import { ErrorSeverity, ErrorType, Rule, SourceError } from '../../../types';
export declare class NoIfWithoutElseError implements SourceError {
    node: es.IfStatement;
    type: ErrorType;
    severity: ErrorSeverity;
    constructor(node: es.IfStatement);
    get location(): es.SourceLocation;
    explain(): string;
    elaborate(): string;
}
declare const noIfWithoutElse: Rule<es.IfStatement>;
export default noIfWithoutElse;
