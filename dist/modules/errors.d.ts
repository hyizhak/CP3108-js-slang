import type * as es from 'estree';
import { RuntimeSourceError } from '../errors/runtimeSourceError';
export declare class UndefinedImportError extends RuntimeSourceError {
    readonly symbol: string;
    readonly moduleName: string;
    constructor(symbol: string, moduleName: string, node?: es.ImportSpecifier);
    explain(): string;
    elaborate(): string;
}
export declare class ModuleConnectionError extends RuntimeSourceError {
    private static message;
    private static elaboration;
    constructor(node?: es.Node);
    explain(): string;
    elaborate(): string;
}
export declare class ModuleNotFoundError extends RuntimeSourceError {
    moduleName: string;
    constructor(moduleName: string, node?: es.Node);
    explain(): string;
    elaborate(): string;
}
export declare class ModuleInternalError extends RuntimeSourceError {
    moduleName: string;
    error?: any;
    constructor(moduleName: string, error?: any, node?: es.Node);
    explain(): string;
    elaborate(): string;
}
