import type * as es from 'estree';
/**
 * Filters out all import declarations from a program, and sorts them by
 * the module they import from
 */
export declare function filterImportDeclarations({ body }: es.Program): [
    Record<string, es.ImportDeclaration[]>,
    Exclude<es.Program['body'][0], es.ImportDeclaration>[]
];
