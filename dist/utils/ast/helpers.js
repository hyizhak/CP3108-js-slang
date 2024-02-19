"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.filterImportDeclarations = void 0;
const assert_1 = require("../assert");
const typeGuards_1 = require("./typeGuards");
/**
 * Filters out all import declarations from a program, and sorts them by
 * the module they import from
 */
function filterImportDeclarations({ body }) {
    return body.reduce(([importNodes, otherNodes], node) => {
        if (!(0, typeGuards_1.isImportDeclaration)(node))
            return [importNodes, [...otherNodes, node]];
        const moduleName = node.source.value;
        (0, assert_1.default)(typeof moduleName === 'string', `Expected import declaration to have source of type string, got ${moduleName}`);
        if (!(moduleName in importNodes)) {
            importNodes[moduleName] = [];
        }
        importNodes[moduleName].push(node);
        return [importNodes, otherNodes];
    }, [{}, []]);
}
exports.filterImportDeclarations = filterImportDeclarations;
//# sourceMappingURL=helpers.js.map