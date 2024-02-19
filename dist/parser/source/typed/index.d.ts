import { Options as AcornOptions } from 'acorn';
import { Program } from 'estree';
import { Context } from '../../..';
import { SourceParser } from '..';
export declare class SourceTypedParser extends SourceParser {
    parse(programStr: string, context: Context, options?: Partial<AcornOptions>, throwOnError?: boolean): Program | null;
    toString(): string;
}
