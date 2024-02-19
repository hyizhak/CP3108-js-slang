import * as es from 'estree';
import { RawSourceMap } from 'source-map';
import type { ImportTransformOptions } from '../modules/moduleTypes';
import { Context, NativeStorage, RecursivePartial } from '../types';
/**
 * This whole transpiler includes many many many many hacks to get stuff working.
 * Order in which certain functions are called matter as well.
 * There should be an explanation on it coming up soon.
 */
declare const globalIdNames: readonly ["native", "callIfFuncAndRightArgs", "boolOrErr", "wrap", "wrapSourceModule", "unaryOp", "binaryOp", "throwIfTimeout", "setProp", "getProp", "builtins"];
export declare type NativeIds = Record<typeof globalIdNames[number], es.Identifier>;
export declare function transformImportDeclarations(program: es.Program, usedIdentifiers: Set<string>, { wrapSourceModules, checkImports, loadTabs }: ImportTransformOptions, context?: Context, nativeId?: es.Identifier, useThis?: boolean): Promise<[string, es.VariableDeclaration[], es.Program['body']]>;
export declare function getGloballyDeclaredIdentifiers(program: es.Program): string[];
export declare function getBuiltins(nativeStorage: NativeStorage): es.Statement[];
export declare function evallerReplacer(nativeStorageId: NativeIds['native'], usedIdentifiers: Set<string>): es.ExpressionStatement;
export declare function checkForUndefinedVariables(program: es.Program, nativeStorage: NativeStorage, globalIds: NativeIds, skipUndefined: boolean): void;
export declare type TranspiledResult = {
    transpiled: string;
    sourceMapJson?: RawSourceMap;
};
export declare function transpile(program: es.Program, context: Context, importOptions?: RecursivePartial<ImportTransformOptions>, skipUndefined?: boolean): Promise<TranspiledResult>;
export {};
