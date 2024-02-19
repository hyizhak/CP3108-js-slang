import * as es from 'estree';
import { ErrorSeverity, ErrorType, Rule, SourceError } from '../../../types';
export declare class NoDeclareMutableError implements SourceError {
    node: es.VariableDeclaration;
    type: ErrorType;
    severity: ErrorSeverity;
    constructor(node: es.VariableDeclaration);
    get location(): es.SourceLocation;
    explain(): string;
    elaborate(): string;
}
declare const noDeclareMutable: Rule<es.VariableDeclaration>;
export default noDeclareMutable;
