import { Program } from 'estree';
import { Chapter, Context } from '../../types';
import { AcornOptions, Parser } from '../types';
export declare class PythonParser implements Parser<AcornOptions> {
    private chapter;
    constructor(chapter: Chapter);
    parse(programStr: string, context: Context, options?: Partial<AcornOptions>, throwOnError?: boolean): Program | null;
    validate(_ast: Program, _context: Context, _throwOnError: boolean): boolean;
    toString(): string;
}
