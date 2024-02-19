import type * as es from 'estree';
import type { IOptions, Result } from '..';
import { Context, RecursivePartial } from '../types';
export declare function sourceRunner(program: es.Program, context: Context, isVerboseErrorsEnabled: boolean, options?: RecursivePartial<IOptions>): Promise<Result>;
export declare function sourceFilesRunner(files: Partial<Record<string, string>>, entrypointFilePath: string, context: Context, options?: RecursivePartial<IOptions>): Promise<Result>;
