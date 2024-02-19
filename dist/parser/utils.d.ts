import { Comment, ecmaVersion, Node, Position } from 'acorn';
import { Program, SourceLocation } from 'estree';
import { Context } from '..';
import { SourceError } from '../types';
import { AcornOptions, BabelOptions } from './types';
/**
 * Generates options object for acorn parser
 *
 * @param ecmaVersion ECMA version
 * @param errors error container
 * @param throwOnError throw on error if true else push to error container and resume exec
 * @param options partial acorn options
 * @returns
 */
export declare const createAcornParserOptions: (ecmaVersion: ecmaVersion, errors?: SourceError[], options?: Partial<AcornOptions>, throwOnError?: boolean) => AcornOptions;
/**
 * Parses a single expression at a specified offset
 *
 * @param programStr program string
 * @param offset position offset
 * @param ecmaVersion ECMA version
 * @returns acorn AST Node if parse succeeds else null
 */
export declare function parseAt(programStr: string, offset: number, ecmaVersion?: ecmaVersion): Node | null;
/**
 * Parse a program, returning alongside comments found within that program
 *
 * @param programStr program string
 * @param ecmaVersion ECMA version
 * @returns tuple consisting of the parsed program, and a list of comments found within the program string
 */
export declare function parseWithComments(programStr: string, ecmaVersion?: ecmaVersion): [Program, Comment[]];
/**
 * Parse program with error-tolerant acorn parser
 *
 * @param programStr program string
 * @param context js-slang context
 * @returns ast for program string
 */
export declare function looseParse(programStr: string, context: Context): Program;
/**
 * TODO
 *
 * @param programStr program string
 * @param context js-slang context
 * @returns ast for program string
 */
export declare function typedParse(programStr: string, context: Context): Program;
/**
 * Converts acorn parser Position object to SourceLocation object
 *
 * @param position acorn Position object
 * @returns SourceLocation
 */
export declare const positionToSourceLocation: (position: Position, source?: string) => SourceLocation;
export declare const defaultBabelOptions: BabelOptions;
