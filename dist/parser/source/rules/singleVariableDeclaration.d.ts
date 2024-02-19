import * as es from 'estree';
import { ErrorSeverity, ErrorType, Rule, SourceError } from '../../../types';
export declare class MultipleDeclarationsError implements SourceError {
    node: es.VariableDeclaration;
    type: ErrorType;
    severity: ErrorSeverity;
    private fixs;
    constructor(node: es.VariableDeclaration);
    get location(): es.SourceLocation;
    explain(): string;
    elaborate(): string;
}
declare const singleVariableDeclaration: Rule<es.VariableDeclaration>;
export default singleVariableDeclaration;
