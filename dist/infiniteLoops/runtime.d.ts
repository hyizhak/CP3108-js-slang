import * as es from 'estree';
import { InfiniteLoopError } from './errors';
/**
 * Tests the given program for infinite loops.
 * @param program Program to test.
 * @param previousProgramsStack Any code previously entered in the REPL & parsed into AST.
 * @returns SourceError if an infinite loop was detected, undefined otherwise.
 */
export declare function testForInfiniteLoop(program: es.Program, previousProgramsStack: es.Program[]): Promise<InfiniteLoopError | undefined>;
