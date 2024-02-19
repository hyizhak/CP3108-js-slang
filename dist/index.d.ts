import { SourceLocation } from 'estree';
import createContext from './createContext';
import { setBreakpointAtLine } from './stdlib/inspector';
import { Context, Error as ResultError, ExecutionMethod, Finished, ModuleContext, RecursivePartial, Result, SourceError, SVMProgram, Variant } from './types';
import { assemble } from './vm/svml-assembler';
export { SourceDocumentation } from './editors/ace/docTooltip';
import type { ImportTransformOptions } from './modules/moduleTypes';
import { NameDeclaration } from './name-extractor';
export interface IOptions {
    scheduler: 'preemptive' | 'async';
    steps: number;
    stepLimit: number;
    executionMethod: ExecutionMethod;
    variant: Variant;
    originalMaxExecTime: number;
    useSubst: boolean;
    isPrelude: boolean;
    throwInfiniteLoops: boolean;
    envSteps: number;
    importOptions: ImportTransformOptions;
}
export declare function parseError(errors: SourceError[], verbose?: boolean): string;
export declare function findDeclaration(code: string, context: Context, loc: {
    line: number;
    column: number;
}): SourceLocation | null | undefined;
export declare function getScope(code: string, context: Context, loc: {
    line: number;
    column: number;
}): SourceLocation[];
export declare function getAllOccurrencesInScope(code: string, context: Context, loc: {
    line: number;
    column: number;
}): SourceLocation[];
export declare function hasDeclaration(code: string, context: Context, loc: {
    line: number;
    column: number;
}): boolean;
/**
 * Gets names present within a string of code
 * @param code Code to parse
 * @param line Line position of the cursor
 * @param col Column position of the cursor
 * @param context Evaluation context
 * @returns `[NameDeclaration[], true]` if suggestions should be displayed, `[[], false]` otherwise
 */
export declare function getNames(code: string, line: number, col: number, context: Context): Promise<[NameDeclaration[], boolean]>;
export declare function getTypeInformation(code: string, context: Context, loc: {
    line: number;
    column: number;
}, name: string): string;
export declare function runInContext(code: string, context: Context, options?: RecursivePartial<IOptions>): Promise<Result>;
export declare function runFilesInContext(files: Partial<Record<string, string>>, entrypointFilePath: string, context: Context, options?: RecursivePartial<IOptions>): Promise<Result>;
export declare function resume(result: Result): Finished | ResultError | Promise<Result>;
export declare function interrupt(context: Context): void;
export declare function compile(code: string, context: Context, vmInternalFunctions?: string[]): SVMProgram | undefined;
export declare function compileFiles(files: Partial<Record<string, string>>, entrypointFilePath: string, context: Context, vmInternalFunctions?: string[]): SVMProgram | undefined;
export { createContext, Context, ModuleContext, Result, setBreakpointAtLine, assemble };
