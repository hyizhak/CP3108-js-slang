import * as es from 'estree';
import { ErrorSeverity, ErrorType, Rule, SourceError } from '../../../types';
export declare class BracesAroundIfElseError implements SourceError {
    node: es.IfStatement;
    private branch;
    type: ErrorType;
    severity: ErrorSeverity;
    constructor(node: es.IfStatement, branch: 'consequent' | 'alternate');
    get location(): es.SourceLocation;
    explain(): "Missing curly braces around \"if\" block." | "Missing curly braces around \"else\" block.";
    elaborate(): string;
}
declare const bracesAroundIfElse: Rule<es.IfStatement>;
export default bracesAroundIfElse;
