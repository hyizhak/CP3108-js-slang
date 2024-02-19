import * as es from 'estree';
import { BlockFrame, DefinitionNode } from './types';
/**
 * This file parses the original AST Tree into another tree with a similar structure
 * This new scope tree is far simplified and contains only two types of nodes
 * The first is called a DefinitionNode, which represents any form of const, let or function definition
 * The second is a BlockFrame. For normal blocks, it is everything within the curly braces
 * However, for conditionals, loops and functions and the like, it includes the related stuff outside of the curly braces
 * For example, for the arguments in the function definition, it will be part of the function's BlockFrame and not the parents.
 * BlockFrames can be seen as a rough approximation of scope and is largely based of estree's BlockStatement.
 */
/**
 * scopeVariables help to transform the AST tree from acorn into the scope tree.
 * It returns the new root of the scope tree.
 * Although it is a long function, the work done is fairly simple.
 * First, we get the estree nodes that are in the current es.BlockStatement/es.Program
 * We transform the current Program/BlockStatement into a BlockFrame and all its relevant children into
 * DefinitionNodes where applicable.
 * Then recursively call this on the child BlockStatements to generate the tree.
 */
export declare function scopeVariables(program: es.Program | es.BlockStatement, enclosingLoc?: es.SourceLocation | null): BlockFrame;
export declare function scopeVariableDeclaration(node: es.VariableDeclaration): DefinitionNode;
export declare function getScopeHelper(definitionLocation: es.SourceLocation, program: es.Program, target: string): es.SourceLocation[];
/**
 * Gets all instances of a variable being used in the child scope.
 * Given the definition location on the variable, get the BlockFrame it resides in.
 * Then, run depth first search from that BlockFrame.
 * This DFS terminates when there are no child blocks within that block,
 * or if the variable name has been redeclared. This means that is of a different scope
 * and the function will terminate there.
 */
export declare function getAllOccurrencesInScopeHelper(definitionLocation: es.SourceLocation, program: es.Program, target: string): es.SourceLocation[];
export declare function getBlockFromLoc(loc: es.SourceLocation, block: BlockFrame): BlockFrame;
export declare function getAllIdentifiers(program: es.Program, target: string): es.Identifier[];
export declare function getNodeLocsInCurrentBlockFrame<E extends es.Node>(nodes: E[], currentLoc: es.SourceLocation, blocks: BlockFrame[]): es.SourceLocation[];
/**
 * Returns all BlockFrames that are a direct child of the parent BlockFrame
 * This helps us weed out the nested BlockFrames, which would affect the accuracy of the
 * refactoring.
 */
export declare function getBlockFramesInCurrentBlockFrame(nodes: BlockFrame[], currentLoc: es.SourceLocation, blocks: BlockFrame[]): BlockFrame[];
