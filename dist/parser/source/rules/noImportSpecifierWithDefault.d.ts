import * as es from 'estree';
import { ErrorSeverity, ErrorType, Rule, SourceError } from '../../../types';
export declare class NoImportSpecifierWithDefaultError implements SourceError {
    node: es.ImportSpecifier;
    type: ErrorType;
    severity: ErrorSeverity;
    constructor(node: es.ImportSpecifier);
    get location(): es.SourceLocation;
    explain(): string;
    elaborate(): string;
}
declare const noImportSpecifierWithDefault: Rule<es.ImportSpecifier>;
export default noImportSpecifierWithDefault;
