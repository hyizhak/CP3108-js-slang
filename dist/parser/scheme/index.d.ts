import { Program } from 'estree';
import { Chapter, Context, SourceError } from '../../types';
import { AcornOptions, Parser } from '../types';
export declare class SchemeParser implements Parser<AcornOptions> {
    private chapter;
    constructor(chapter: Chapter);
    parse(programStr: string, context: Context, options?: Partial<AcornOptions>, throwOnError?: boolean): Program | null;
    validate(_ast: Program, _context: Context, _throwOnError: boolean): boolean;
    toString(): string;
}
export declare function encodeTree(tree: Program): Program;
export declare function decodeValue(x: any): any;
export declare function decodeError(error: SourceError): SourceError;
