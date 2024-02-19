import * as es from 'estree';
import { ErrorSeverity, ErrorType, Rule, SourceError } from '../../../types';
export declare class NoVarError implements SourceError {
    node: es.VariableDeclaration;
    type: ErrorType;
    severity: ErrorSeverity;
    constructor(node: es.VariableDeclaration);
    get location(): es.SourceLocation;
    explain(): string;
    elaborate(): string;
}
declare const noVar: Rule<es.VariableDeclaration>;
export default noVar;
