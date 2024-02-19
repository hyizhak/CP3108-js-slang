import { Program } from 'estree';
import { Context } from '../..';
import { AcornOptions, Parser } from '../types';
export declare class FullTSParser implements Parser<AcornOptions> {
    parse(programStr: string, context: Context, options?: Partial<AcornOptions>, throwOnError?: boolean): Program | null;
    validate(_ast: Program, _context: Context, _throwOnError: boolean): boolean;
    toString(): string;
}
