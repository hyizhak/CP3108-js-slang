import * as es from 'estree';
import { Context } from '../';
export interface NameDeclaration {
    name: string;
    meta: string;
    score?: number;
}
/**
 * Retrieves keyword suggestions based on what node the cursor is currently over.
 * For example, only suggest `let` when the cursor is over the init part of a for
 * statement
 * @param prog Program to parse
 * @param cursorLoc Current location of the cursor
 * @param context Evaluation context
 * @returns A list of keywords as suggestions
 */
export declare function getKeywords(prog: es.Node, cursorLoc: es.Position, context: Context): NameDeclaration[];
/**
 * Retrieve the list of names present within the program. If the cursor is within a comment,
 * or when the user is declaring a variable or function arguments, suggestions should not be displayed,
 * indicated by the second part of the return value of this function.
 * @param prog Program to parse for names
 * @param comments Comments found within the program
 * @param cursorLoc Current location of the cursor
 * @returns Tuple consisting of the list of suggestions, and a boolean value indicating if
 * suggestions should be displayed, i.e. `[suggestions, shouldPrompt]`
 */
export declare function getProgramNames(prog: es.Node, comments: acorn.Comment[], cursorLoc: es.Position): [NameDeclaration[], boolean];
