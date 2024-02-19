"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFunctionDeclarationNamesInProgram = exports.getIdentifiersInProgram = exports.getIdentifiersInNativeStorage = exports.getUniqueId = void 0;
const walkers_1 = require("../utils/walkers");
function getUniqueId(usedIdentifiers, uniqueId = 'unique') {
    while (usedIdentifiers.has(uniqueId)) {
        const start = uniqueId.slice(0, -1);
        const end = uniqueId[uniqueId.length - 1];
        const endToDigit = Number(end);
        if (Number.isNaN(endToDigit) || endToDigit === 9) {
            uniqueId += '0';
        }
        else {
            uniqueId = start + String(endToDigit + 1);
        }
    }
    usedIdentifiers.add(uniqueId);
    return uniqueId;
}
exports.getUniqueId = getUniqueId;
function getIdentifiersInNativeStorage(nativeStorage) {
    const used = new Set(...nativeStorage.builtins.keys());
    nativeStorage.previousProgramsIdentifiers.forEach(id => used.add(id));
    return used;
}
exports.getIdentifiersInNativeStorage = getIdentifiersInNativeStorage;
function getIdentifiersInProgram(program) {
    const identifiers = new Set();
    (0, walkers_1.simple)(program, {
        Identifier(node) {
            identifiers.add(node.name);
        },
        Pattern(node) {
            if (node.type === 'Identifier') {
                identifiers.add(node.name);
            }
            else if (node.type === 'MemberExpression') {
                if (node.object.type === 'Identifier') {
                    identifiers.add(node.object.name);
                }
            }
        }
    });
    return identifiers;
}
exports.getIdentifiersInProgram = getIdentifiersInProgram;
function getFunctionDeclarationNamesInProgram(program) {
    const functionNames = new Set();
    (0, walkers_1.simple)(program, {
        FunctionDeclaration(node) {
            if (node.id && node.id.type === 'Identifier') {
                functionNames.add(node.id.name);
            }
        }
    });
    return functionNames;
}
exports.getFunctionDeclarationNamesInProgram = getFunctionDeclarationNamesInProgram;
//# sourceMappingURL=uniqueIds.js.map