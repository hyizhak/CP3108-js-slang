"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateAndAnnotate = void 0;
const errors_1 = require("../errors/errors");
const validityErrors_1 = require("../errors/validityErrors");
const astCreator_1 = require("../utils/astCreator");
const walkers_1 = require("../utils/walkers");
class Declaration {
    constructor(isConstant) {
        this.isConstant = isConstant;
        this.accessedBeforeDeclaration = false;
    }
}
function validateAndAnnotate(program, context) {
    const accessedBeforeDeclarationMap = new Map();
    const scopeHasCallExpressionMap = new Map();
    function processBlock(node) {
        const initialisedIdentifiers = new Map();
        for (const statement of node.body) {
            if (statement.type === 'VariableDeclaration') {
                initialisedIdentifiers.set((0, astCreator_1.getVariableDecarationName)(statement), new Declaration(statement.kind === 'const'));
            }
            else if (statement.type === 'FunctionDeclaration') {
                if (statement.id === null) {
                    throw new Error('Encountered a FunctionDeclaration node without an identifier. This should have been caught when parsing.');
                }
                initialisedIdentifiers.set(statement.id.name, new Declaration(true));
            }
        }
        scopeHasCallExpressionMap.set(node, false);
        accessedBeforeDeclarationMap.set(node, initialisedIdentifiers);
    }
    function processFunction(node) {
        accessedBeforeDeclarationMap.set(node, new Map(node.params.map(id => [id.name, new Declaration(false)])));
        scopeHasCallExpressionMap.set(node, false);
    }
    // initialise scope of variables
    (0, walkers_1.ancestor)(program, {
        Program: processBlock,
        BlockStatement: processBlock,
        FunctionDeclaration: processFunction,
        ArrowFunctionExpression: processFunction,
        ForStatement(forStatement, _ancestors) {
            const init = forStatement.init;
            if (init.type === 'VariableDeclaration') {
                accessedBeforeDeclarationMap.set(forStatement, new Map([[(0, astCreator_1.getVariableDecarationName)(init), new Declaration(init.kind === 'const')]]));
                scopeHasCallExpressionMap.set(forStatement, false);
            }
        }
    });
    function validateIdentifier(id, ancestors) {
        const name = id.name;
        const lastAncestor = ancestors[ancestors.length - 2];
        for (let i = ancestors.length - 1; i >= 0; i--) {
            const a = ancestors[i];
            const map = accessedBeforeDeclarationMap.get(a);
            if (map === null || map === void 0 ? void 0 : map.has(name)) {
                map.get(name).accessedBeforeDeclaration = true;
                if (lastAncestor.type === 'AssignmentExpression' && lastAncestor.left === id) {
                    if (map.get(name).isConstant) {
                        context.errors.push(new errors_1.ConstAssignment(lastAncestor, name));
                    }
                    if (a.type === 'ForStatement' && a.init !== lastAncestor && a.update !== lastAncestor) {
                        context.errors.push(new validityErrors_1.NoAssignmentToForVariable(lastAncestor));
                    }
                }
                break;
            }
        }
    }
    const customWalker = Object.assign(Object.assign({}, walkers_1.base), { VariableDeclarator(node, st, c) {
            // don't visit the id
            if (node.init) {
                c(node.init, st, 'Expression');
            }
        } });
    (0, walkers_1.ancestor)(program, {
        VariableDeclaration(node, ancestors) {
            const lastAncestor = ancestors[ancestors.length - 2];
            const name = (0, astCreator_1.getVariableDecarationName)(node);
            const accessedBeforeDeclaration = accessedBeforeDeclarationMap
                .get(lastAncestor)
                .get(name).accessedBeforeDeclaration;
            node.typability = accessedBeforeDeclaration ? 'Untypable' : 'NotYetTyped';
        },
        Identifier: validateIdentifier,
        FunctionDeclaration(node, ancestors) {
            // a function declaration can be typed if there are no function calls in the same scope before it
            const lastAncestor = ancestors[ancestors.length - 2];
            node.typability = scopeHasCallExpressionMap.get(lastAncestor) ? 'Untypable' : 'NotYetTyped';
        },
        Pattern(node, ancestors) {
            if (node.type === 'Identifier') {
                validateIdentifier(node, ancestors);
            }
            else if (node.type === 'MemberExpression') {
                if (node.object.type === 'Identifier') {
                    validateIdentifier(node.object, ancestors);
                }
            }
        },
        CallExpression(call, ancestors) {
            for (let i = ancestors.length - 1; i >= 0; i--) {
                const a = ancestors[i];
                if (scopeHasCallExpressionMap.has(a)) {
                    scopeHasCallExpressionMap.set(a, true);
                    break;
                }
            }
        }
    }, customWalker);
    /*
    simple(program, {
      VariableDeclaration(node: TypeAnnotatedNode<es.VariableDeclaration>) {
        console.log(getVariableDecarationName(node) + " " + node.typability);
      },
      FunctionDeclaration(node: TypeAnnotatedNode<es.FunctionDeclaration>) {
        console.log(node.id!.name + " " + node.typability);
      }
    })
  
     */
    return program;
}
exports.validateAndAnnotate = validateAndAnnotate;
//# sourceMappingURL=validator.js.map