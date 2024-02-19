import { IOptions, Result } from '..';
import { Context, RecursivePartial } from '../types';
export declare const htmlErrorHandlingScript: string;
export declare function htmlRunner(code: string, context: Context, options?: RecursivePartial<IOptions>): Promise<Result>;
