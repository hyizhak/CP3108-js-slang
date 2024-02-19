import { Program } from 'estree';
import { Context } from '..';
import { AcornOptions } from './types';
export declare function parse<TOptions extends AcornOptions>(programStr: string, context: Context, options?: Partial<TOptions>, throwOnError?: boolean): Program | null;
