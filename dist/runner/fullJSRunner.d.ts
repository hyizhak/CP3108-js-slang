import type * as es from 'estree';
import type { Result } from '..';
import { ImportTransformOptions } from '../modules/moduleTypes';
import type { Context } from '../types';
export declare function fullJSRunner(program: es.Program, context: Context, importOptions: ImportTransformOptions): Promise<Result>;
