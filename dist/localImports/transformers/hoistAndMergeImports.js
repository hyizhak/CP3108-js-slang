"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hoistAndMergeImports = void 0;
const _ = require("lodash");
const typeGuards_1 = require("../../utils/ast/typeGuards");
const baseConstructors_1 = require("../constructors/baseConstructors");
const contextSpecificConstructors_1 = require("../constructors/contextSpecificConstructors");
/**
 * Hoists import declarations to the top of the program & merges duplicate
 * imports for the same module.
 *
 * Note that two modules are the same if and only if their import source
 * is the same. This function does not resolve paths against a base
 * directory. If such a functionality is required, this function will
 * need to be modified.
 *
 * @param program The AST which should have its ImportDeclaration nodes
 *                hoisted & duplicate imports merged.
 */
const hoistAndMergeImports = (program) => {
    var _a;
    // Separate import declarations from non-import declarations.
    const importDeclarations = program.body.filter(typeGuards_1.isImportDeclaration);
    const nonImportDeclarations = program.body.filter((node) => !(0, typeGuards_1.isImportDeclaration)(node));
    // Merge import sources & specifiers.
    const importSourceToSpecifiersMap = new Map();
    for (const importDeclaration of importDeclarations) {
        const importSource = importDeclaration.source.value;
        if (typeof importSource !== 'string') {
            throw new Error('Module names must be strings.');
        }
        const specifiers = (_a = importSourceToSpecifiersMap.get(importSource)) !== null && _a !== void 0 ? _a : [];
        for (const specifier of importDeclaration.specifiers) {
            // The Acorn parser adds extra information to AST nodes that are not
            // part of the ESTree types. As such, we need to clone and strip
            // the import specifier AST nodes to get a canonical representation
            // that we can use to keep track of whether the import specifier
            // is a duplicate or not.
            const strippedSpecifier = (0, contextSpecificConstructors_1.cloneAndStripImportSpecifier)(specifier);
            // Note that we cannot make use of JavaScript's built-in Set class
            // as it compares references for objects.
            const isSpecifierDuplicate = specifiers.filter((specifier) => {
                return _.isEqual(strippedSpecifier, specifier);
            }).length !== 0;
            if (isSpecifierDuplicate) {
                continue;
            }
            specifiers.push(strippedSpecifier);
        }
        importSourceToSpecifiersMap.set(importSource, specifiers);
    }
    // Convert the merged import sources & specifiers back into import declarations.
    const mergedImportDeclarations = [];
    importSourceToSpecifiersMap.forEach((specifiers, importSource) => {
        mergedImportDeclarations.push((0, baseConstructors_1.createImportDeclaration)(specifiers, (0, baseConstructors_1.createLiteral)(importSource)));
    });
    // Hoist the merged import declarations to the top of the program body.
    program.body = [...mergedImportDeclarations, ...nonImportDeclarations];
};
exports.hoistAndMergeImports = hoistAndMergeImports;
//# sourceMappingURL=hoistAndMergeImports.js.map