"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeNonSourceModuleImports = exports.isSourceModule = void 0;
const assert_1 = require("../../utils/assert");
const walkers_1 = require("../../utils/walkers");
const filePaths_1 = require("../filePaths");
/**
 * Returns whether a module name refers to a Source module.
 * We define a Source module name to be any string that is not
 * a file path.
 *
 * Source module import:           `import { x } from "module";`
 * Local (relative) module import: `import { x } from "./module";`
 * Local (absolute) module import: `import { x } from "/dir/dir2/module";`
 *
 * @param moduleName The name of the module.
 */
const isSourceModule = (moduleName) => {
    return !(0, filePaths_1.isFilePath)(moduleName);
};
exports.isSourceModule = isSourceModule;
/**
 * Removes all non-Source module import-related nodes from the AST.
 *
 * All import-related nodes which are not removed in the pre-processing
 * step will be treated by the Source modules loader as a Source module.
 * If a Source module by the same name does not exist, the program
 * evaluation will error out. As such, this function removes all
 * import-related AST nodes which the Source module loader does not
 * support, as well as ImportDeclaration nodes for local module imports.
 *
 * The definition of whether a module is a local module or a Source
 * module depends on the implementation of the `isSourceModule` function.
 *
 * @param program The AST which should be stripped of non-Source module
 *                import-related nodes.
 */
const removeNonSourceModuleImports = (program) => {
    // First pass: remove all import AST nodes which are unused by Source modules.
    (0, walkers_1.ancestor)(program, {
        ImportSpecifier(_node, _state, _ancestors) {
            // Nothing to do here since ImportSpecifier nodes are used by Source modules.
        },
        ImportDefaultSpecifier(node, _state, ancestors) {
            // The ancestors array contains the current node, meaning that the
            // parent node is the second last node of the array.
            const parent = ancestors[ancestors.length - 2];
            // The parent node of an ImportDefaultSpecifier node must be an ImportDeclaration node.
            if (parent.type !== 'ImportDeclaration') {
                return;
            }
            const nodeIndex = parent.specifiers.findIndex(n => n === node);
            // Remove the ImportDefaultSpecifier node in its parent node's array of specifiers.
            // This is because Source modules do not support default imports.
            parent.specifiers.splice(nodeIndex, 1);
        },
        ImportNamespaceSpecifier(node, _state, ancestors) {
            // The ancestors array contains the current node, meaning that the
            // parent node is the second last node of the array.
            const parent = ancestors[ancestors.length - 2];
            // The parent node of an ImportNamespaceSpecifier node must be an ImportDeclaration node.
            if (parent.type !== 'ImportDeclaration') {
                return;
            }
            const nodeIndex = parent.specifiers.findIndex(n => n === node);
            // Remove the ImportNamespaceSpecifier node in its parent node's array of specifiers.
            // This is because Source modules do not support namespace imports.
            parent.specifiers.splice(nodeIndex, 1);
        }
    });
    // Operate on a copy of the Program node's body to prevent the walk from missing ImportDeclaration nodes.
    const programBody = [...program.body];
    const removeImportDeclaration = (node, ancestors) => {
        // The ancestors array contains the current node, meaning that the
        // parent node is the second last node of the array.
        const parent = ancestors[ancestors.length - 2];
        // The parent node of an ImportDeclaration node must be a Program node.
        if (parent.type !== 'Program') {
            return;
        }
        const nodeIndex = programBody.findIndex(n => n === node);
        // Remove the ImportDeclaration node in its parent node's body.
        programBody.splice(nodeIndex, 1);
    };
    // Second pass: remove all ImportDeclaration nodes for non-Source modules, or that do not
    // have any specifiers (thus being functionally useless).
    (0, walkers_1.ancestor)(program, {
        ImportDeclaration(node, _state, ancestors) {
            (0, assert_1.default)(typeof node.source.value === 'string', 'Module names must be strings.');
            // ImportDeclaration nodes without any specifiers are functionally useless and are thus removed.
            if (node.specifiers.length === 0) {
                removeImportDeclaration(node, ancestors);
                return;
            }
            // Non-Source modules should already have been handled in the pre-processing step and are no
            // longer needed. They must be removed to avoid being treated as Source modules.
            if (!(0, exports.isSourceModule)(node.source.value)) {
                removeImportDeclaration(node, ancestors);
            }
        }
    });
    program.body = programBody;
};
exports.removeNonSourceModuleImports = removeNonSourceModuleImports;
//# sourceMappingURL=removeNonSourceModuleImports.js.map