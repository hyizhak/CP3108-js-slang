import es from 'estree';
/**
 * Constructs a call to the `pair` function.
 *
 * @param head The head of the pair.
 * @param tail The tail of the pair.
 */
export declare const createPairCallExpression: (head: es.Expression | es.SpreadElement, tail: es.Expression | es.SpreadElement) => es.SimpleCallExpression;
/**
 * Constructs a call to the `list` function.
 *
 * @param listElements The elements of the list.
 */
export declare const createListCallExpression: (listElements: Array<es.Expression | es.SpreadElement>) => es.SimpleCallExpression;
/**
 * Constructs the AST equivalent of:
 * const importedName = __access_export__(functionName, lookupName);
 *
 * @param functionName The name of the transformed function declaration to import from.
 * @param importedName The name of the import.
 * @param lookupName   The name to lookup in the transformed function declaration.
 */
export declare const createImportedNameDeclaration: (functionName: string, importedName: es.Identifier, lookupName: string) => es.VariableDeclaration;
/**
 * Constructs the AST equivalent of:
 * const variableName = functionName(...functionArgs);
 *
 * @param functionName The name of the transformed function declaration to invoke.
 * @param variableName The name of the variable holding the result of the function invocation.
 * @param functionArgs The arguments to be passed when invoking the function.
 */
export declare const createInvokedFunctionResultVariableDeclaration: (functionName: string, variableName: string, functionArgs: es.Identifier[]) => es.VariableDeclaration;
/**
 * Clones the import specifier, but only the properties
 * that are part of its ESTree AST type. This is useful for
 * stripping out extraneous information on the import
 * specifier AST nodes (such as the location information
 * that the Acorn parser adds).
 *
 * @param importSpecifier The import specifier to be cloned.
 */
export declare const cloneAndStripImportSpecifier: (importSpecifier: es.ImportSpecifier | es.ImportDefaultSpecifier | es.ImportNamespaceSpecifier) => es.ImportSpecifier | es.ImportDefaultSpecifier | es.ImportNamespaceSpecifier;