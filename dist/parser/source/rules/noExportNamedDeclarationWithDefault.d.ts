import * as es from 'estree';
import { ErrorSeverity, ErrorType, Rule, SourceError } from '../../../types';
export declare class NoExportNamedDeclarationWithDefaultError implements SourceError {
    node: es.ExportNamedDeclaration;
    type: ErrorType;
    severity: ErrorSeverity;
    constructor(node: es.ExportNamedDeclaration);
    get location(): es.SourceLocation;
    explain(): string;
    elaborate(): string;
}
declare const noExportNamedDeclarationWithDefault: Rule<es.ExportNamedDeclaration>;
export default noExportNamedDeclarationWithDefault;
