import * as es from 'estree';
import { Context, NodeWithInferredType, SourceError } from '../types';
/**
 * An additional layer of typechecking to be done right after parsing.
 * @param program Parsed Program
 */
export declare function typeCheck(program: NodeWithInferredType<es.Program>, context: Context): [NodeWithInferredType<es.Program>, SourceError[]];
