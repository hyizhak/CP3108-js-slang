import * as es from 'estree';
import { ErrorSeverity, ErrorType, Rule, SourceError } from '../../../types';
export declare class NoFunctionDeclarationWithoutIdentifierError implements SourceError {
    node: es.FunctionDeclaration;
    type: ErrorType;
    severity: ErrorSeverity;
    constructor(node: es.FunctionDeclaration);
    get location(): es.SourceLocation;
    explain(): string;
    elaborate(): string;
}
declare const noFunctionDeclarationWithoutIdentifier: Rule<es.FunctionDeclaration>;
export default noFunctionDeclarationWithoutIdentifier;
