import * as es from 'estree';
import { Context } from '../types';
import * as tsEs from './tsESTree';
/**
 * Entry function for type error checker.
 * Checks program for type errors, and returns the program with all TS-related nodes removed.
 */
export declare function checkForTypeErrors(program: tsEs.Program, inputContext: Context): es.Program;
/**
 * Traverses through the program and removes all TS-related nodes, returning the result.
 */
export declare function removeTSNodes(node: tsEs.Node | undefined | null): any;
