import * as es from 'estree';
import { ErrorSeverity, ErrorType, Rule, SourceError } from '../../../types';
export declare class NoImplicitDeclareUndefinedError implements SourceError {
    node: es.Identifier;
    type: ErrorType;
    severity: ErrorSeverity;
    constructor(node: es.Identifier);
    get location(): es.SourceLocation;
    explain(): string;
    elaborate(): string;
}
declare const noImplicitDeclareUndefined: Rule<es.VariableDeclaration>;
export default noImplicitDeclareUndefined;
