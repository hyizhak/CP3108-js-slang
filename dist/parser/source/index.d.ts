import { Token } from 'acorn';
import { Program } from 'estree';
import { Chapter, Context, Variant } from '../../types';
import { AcornOptions, Parser } from '../types';
export declare class SourceParser implements Parser<AcornOptions> {
    private chapter;
    private variant;
    constructor(chapter: Chapter, variant: Variant);
    static tokenize(programStr: string, context: Context): Token[];
    parse(programStr: string, context: Context, options?: Partial<AcornOptions>, throwOnError?: boolean): Program | null;
    validate(ast: Program, context: Context, throwOnError?: boolean): boolean;
    toString(): string;
    private getDisallowedSyntaxes;
    private getLangRules;
}
