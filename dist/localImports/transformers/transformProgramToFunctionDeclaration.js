"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.transformProgramToFunctionDeclaration = exports.createAccessImportStatements = exports.getInvokedFunctionResultVariableNameToImportSpecifiersMap = void 0;
const path_1 = require("path");
const localImport_prelude_1 = require("../../stdlib/localImport.prelude");
const assert_1 = require("../../utils/assert");
const typeGuards_1 = require("../../utils/ast/typeGuards");
const baseConstructors_1 = require("../constructors/baseConstructors");
const contextSpecificConstructors_1 = require("../constructors/contextSpecificConstructors");
const filePaths_1 = require("../filePaths");
const removeNonSourceModuleImports_1 = require("./removeNonSourceModuleImports");
const getInvokedFunctionResultVariableNameToImportSpecifiersMap = (nodes, currentDirPath) => {
    const invokedFunctionResultVariableNameToImportSpecifierMap = {};
    nodes.forEach((node) => {
        // Only ImportDeclaration nodes specify imported names.
        if (node.type !== 'ImportDeclaration') {
            return;
        }
        const importSource = node.source.value;
        (0, assert_1.default)(typeof importSource === 'string', 'Encountered an ImportDeclaration node with a non-string source. This should never occur.');
        // Only handle import declarations for non-Source modules.
        if ((0, removeNonSourceModuleImports_1.isSourceModule)(importSource)) {
            return;
        }
        // Different import sources can refer to the same file. For example,
        // both './b.js' & '../dir/b.js' can refer to the same file if the
        // current file path is '/dir/a.js'. To ensure that every file is
        // processed only once, we resolve the import source against the
        // current file path to get the absolute file path of the file to
        // be imported. Since the absolute file path is guaranteed to be
        // unique, it is also the canonical file path.
        const importFilePath = path_1.posix.resolve(currentDirPath, importSource);
        // Even though we limit the chars that can appear in Source file
        // paths, some chars in file paths (such as '/') cannot be used
        // in function names. As such, we substitute illegal chars with
        // legal ones in a manner that gives us a bijective mapping from
        // file paths to function names.
        const importFunctionName = (0, filePaths_1.transformFilePathToValidFunctionName)(importFilePath);
        // In the top-level environment of the resulting program, for every
        // imported file, we will end up with two different names; one for
        // the function declaration, and another for the variable holding
        // the result of invoking the function. The former is represented
        // by 'importFunctionName', while the latter is represented by
        // 'invokedFunctionResultVariableName'. Since multiple files can
        // import the same file, yet we only want the code in each file to
        // be evaluated a single time (and share the same state), we need to
        // evaluate the transformed functions (of imported files) only once
        // in the top-level environment of the resulting program, then pass
        // the result (the exported names) into other transformed functions.
        // Having the two different names helps us to achieve this objective.
        const invokedFunctionResultVariableName = (0, filePaths_1.transformFunctionNameToInvokedFunctionResultVariableName)(importFunctionName);
        // If this is the file ImportDeclaration node for the canonical
        // file path, instantiate the entry in the map.
        if (invokedFunctionResultVariableNameToImportSpecifierMap[invokedFunctionResultVariableName] ===
            undefined) {
            invokedFunctionResultVariableNameToImportSpecifierMap[invokedFunctionResultVariableName] = [];
        }
        invokedFunctionResultVariableNameToImportSpecifierMap[invokedFunctionResultVariableName].push(...node.specifiers);
    });
    return invokedFunctionResultVariableNameToImportSpecifierMap;
};
exports.getInvokedFunctionResultVariableNameToImportSpecifiersMap = getInvokedFunctionResultVariableNameToImportSpecifiersMap;
const getIdentifier = (node) => {
    switch (node.type) {
        case 'FunctionDeclaration':
            (0, assert_1.default)(node.id !== null, 'Encountered a FunctionDeclaration node without an identifier. This should have been caught when parsing.');
            return node.id;
        case 'VariableDeclaration':
            const id = node.declarations[0].id;
            // In Source, variable names are Identifiers.
            (0, assert_1.default)(id.type === 'Identifier', `Expected variable name to be an Identifier, but was ${id.type} instead.`);
            return id;
        case 'ClassDeclaration':
            throw new Error('Exporting of class is not supported.');
    }
};
const getExportedNameToIdentifierMap = (nodes) => {
    const exportedNameToIdentifierMap = {};
    nodes.forEach((node) => {
        // Only ExportNamedDeclaration nodes specify exported names.
        if (node.type !== 'ExportNamedDeclaration') {
            return;
        }
        if (node.declaration) {
            const identifier = getIdentifier(node.declaration);
            if (identifier === null) {
                return;
            }
            // When an ExportNamedDeclaration node has a declaration, the
            // identifier is the same as the exported name (i.e., no renaming).
            const exportedName = identifier.name;
            exportedNameToIdentifierMap[exportedName] = identifier;
        }
        else {
            // When an ExportNamedDeclaration node does not have a declaration,
            // it contains a list of names to export, i.e., export { a, b as c, d };.
            // Exported names can be renamed using the 'as' keyword. As such, the
            // exported names and their corresponding identifiers might be different.
            node.specifiers.forEach((node) => {
                const exportedName = node.exported.name;
                const identifier = node.local;
                exportedNameToIdentifierMap[exportedName] = identifier;
            });
        }
    });
    return exportedNameToIdentifierMap;
};
const getDefaultExportExpression = (nodes, exportedNameToIdentifierMap) => {
    let defaultExport = null;
    // Handle default exports which are parsed as ExportNamedDeclaration AST nodes.
    // 'export { name as default };' is equivalent to 'export default name;' but
    // is represented by an ExportNamedDeclaration node instead of an
    // ExportedDefaultDeclaration node.
    //
    // NOTE: If there is a named export representing the default export, its entry
    // in the map must be removed to prevent it from being treated as a named export.
    if (exportedNameToIdentifierMap['default'] !== undefined) {
        defaultExport = exportedNameToIdentifierMap['default'];
        delete exportedNameToIdentifierMap['default'];
    }
    nodes.forEach((node) => {
        // Only ExportDefaultDeclaration nodes specify the default export.
        if (node.type !== 'ExportDefaultDeclaration') {
            return;
        }
        // This should never occur because multiple default exports should have
        // been caught by the Acorn parser when parsing into an AST.
        (0, assert_1.default)(defaultExport === null, 'Encountered multiple default exports!');
        if ((0, typeGuards_1.isDeclaration)(node.declaration)) {
            const identifier = getIdentifier(node.declaration);
            if (identifier === null) {
                return;
            }
            // When an ExportDefaultDeclaration node has a declaration, the
            // identifier is the same as the exported name (i.e., no renaming).
            defaultExport = identifier;
        }
        else {
            // When an ExportDefaultDeclaration node does not have a declaration,
            // it has an expression.
            defaultExport = node.declaration;
        }
    });
    return defaultExport;
};
const createAccessImportStatements = (invokedFunctionResultVariableNameToImportSpecifiersMap) => {
    const importDeclarations = [];
    for (const [invokedFunctionResultVariableName, importSpecifiers] of Object.entries(invokedFunctionResultVariableNameToImportSpecifiersMap)) {
        importSpecifiers.forEach((importSpecifier) => {
            let importDeclaration;
            switch (importSpecifier.type) {
                case 'ImportSpecifier':
                    importDeclaration = (0, contextSpecificConstructors_1.createImportedNameDeclaration)(invokedFunctionResultVariableName, importSpecifier.local, importSpecifier.imported.name);
                    break;
                case 'ImportDefaultSpecifier':
                    importDeclaration = (0, contextSpecificConstructors_1.createImportedNameDeclaration)(invokedFunctionResultVariableName, importSpecifier.local, localImport_prelude_1.defaultExportLookupName);
                    break;
                case 'ImportNamespaceSpecifier':
                    // In order to support namespace imports, Source would need to first support objects.
                    throw new Error('Namespace imports are not supported.');
            }
            importDeclarations.push(importDeclaration);
        });
    }
    return importDeclarations;
};
exports.createAccessImportStatements = createAccessImportStatements;
const createReturnListArguments = (exportedNameToIdentifierMap) => {
    return Object.entries(exportedNameToIdentifierMap).map(([exportedName, identifier]) => {
        const head = (0, baseConstructors_1.createLiteral)(exportedName);
        const tail = identifier;
        return (0, contextSpecificConstructors_1.createPairCallExpression)(head, tail);
    });
};
const removeDirectives = (nodes) => {
    return nodes.filter((node) => !(0, typeGuards_1.isDirective)(node));
};
const removeModuleDeclarations = (nodes) => {
    const statements = [];
    nodes.forEach((node) => {
        if ((0, typeGuards_1.isStatement)(node)) {
            statements.push(node);
            return;
        }
        // If there are declaration nodes that are child nodes of the
        // ModuleDeclaration nodes, we add them to the processed statements
        // array so that the declarations are still part of the resulting
        // program.
        switch (node.type) {
            case 'ImportDeclaration':
                break;
            case 'ExportNamedDeclaration':
                if (node.declaration) {
                    statements.push(node.declaration);
                }
                break;
            case 'ExportDefaultDeclaration':
                if ((0, typeGuards_1.isDeclaration)(node.declaration)) {
                    statements.push(node.declaration);
                }
                break;
            case 'ExportAllDeclaration':
                throw new Error('Not implemented yet.');
        }
    });
    return statements;
};
/**
 * Transforms the given program into a function declaration. This is done
 * so that every imported module has its own scope (since functions have
 * their own scope).
 *
 * @param program         The program to be transformed.
 * @param currentFilePath The file path of the current program.
 */
const transformProgramToFunctionDeclaration = (program, currentFilePath) => {
    const moduleDeclarations = program.body.filter(typeGuards_1.isModuleDeclaration);
    const currentDirPath = path_1.posix.resolve(currentFilePath, '..');
    // Create variables to hold the imported statements.
    const invokedFunctionResultVariableNameToImportSpecifiersMap = (0, exports.getInvokedFunctionResultVariableNameToImportSpecifiersMap)(moduleDeclarations, currentDirPath);
    const accessImportStatements = (0, exports.createAccessImportStatements)(invokedFunctionResultVariableNameToImportSpecifiersMap);
    // Create the return value of all exports for the function.
    const exportedNameToIdentifierMap = getExportedNameToIdentifierMap(moduleDeclarations);
    const defaultExportExpression = getDefaultExportExpression(moduleDeclarations, exportedNameToIdentifierMap);
    const defaultExport = defaultExportExpression !== null && defaultExportExpression !== void 0 ? defaultExportExpression : (0, baseConstructors_1.createLiteral)(null);
    const namedExports = (0, contextSpecificConstructors_1.createListCallExpression)(createReturnListArguments(exportedNameToIdentifierMap));
    const returnStatement = (0, baseConstructors_1.createReturnStatement)((0, contextSpecificConstructors_1.createPairCallExpression)(defaultExport, namedExports));
    // Assemble the function body.
    const programStatements = removeModuleDeclarations(removeDirectives(program.body));
    const functionBody = [...accessImportStatements, ...programStatements, returnStatement];
    // Determine the function name based on the absolute file path.
    const functionName = (0, filePaths_1.transformFilePathToValidFunctionName)(currentFilePath);
    // Set the equivalent variable names of imported modules as the function parameters.
    const functionParams = Object.keys(invokedFunctionResultVariableNameToImportSpecifiersMap).map(baseConstructors_1.createIdentifier);
    return (0, baseConstructors_1.createFunctionDeclaration)(functionName, functionParams, functionBody);
};
exports.transformProgramToFunctionDeclaration = transformProgramToFunctionDeclaration;
//# sourceMappingURL=transformProgramToFunctionDeclaration.js.map