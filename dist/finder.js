"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.findAncestors = exports.isInLoc = exports.findDeclarationNode = exports.findIdentifierNode = void 0;
const walkers_1 = require("./utils/walkers");
// Finds the innermost node that matches the given location
function findIdentifierNode(root, context, loc) {
    function findByLocationPredicate(type, node) {
        const location = node.loc;
        const nodeType = node.type;
        if (nodeType && location) {
            return (nodeType === 'Identifier' &&
                location.start.line === loc.line &&
                location.start.column <= loc.column &&
                location.end.column >= loc.column);
        }
        return false;
    }
    const found = (0, walkers_1.findNodeAt)(root, undefined, undefined, findByLocationPredicate, customWalker);
    return found === null || found === void 0 ? void 0 : found.node;
}
exports.findIdentifierNode = findIdentifierNode;
// Recursively searches up the ancestors of the identifier from innermost to outermost scope
function findDeclarationNode(program, identifier) {
    const ancestors = findAncestors(program, identifier);
    if (!ancestors)
        return undefined;
    const declarations = [];
    for (const root of ancestors) {
        (0, walkers_1.recursive)(root, undefined, {
            BlockStatement(node, state, callback) {
                if (containsNode(node, identifier)) {
                    node.body.map(n => callback(n, state));
                }
            },
            ForStatement(node, state, callback) {
                if (containsNode(node, identifier)) {
                    callback(node.init, state);
                    callback(node.body, state);
                }
            },
            FunctionDeclaration(node, state, callback) {
                if (node.id && node.id.name === identifier.name) {
                    declarations.push(node.id);
                }
                else if (containsNode(node, identifier)) {
                    const param = node.params.find(n => n.name === identifier.name);
                    if (param) {
                        declarations.push(param);
                    }
                    else {
                        callback(node.body, state);
                    }
                }
            },
            ArrowFunctionExpression(node, state, callback) {
                if (containsNode(node, identifier)) {
                    const param = node.params.find(n => n.name === identifier.name);
                    if (param) {
                        declarations.push(param);
                    }
                    else {
                        callback(node.body, state);
                    }
                }
            },
            VariableDeclarator(node, _state, _callback) {
                if (node.id.name === identifier.name) {
                    declarations.push(node.id);
                }
            },
            ImportSpecifier(node, _state, _callback) {
                if (node.imported.name === identifier.name) {
                    declarations.push(node.imported);
                }
            }
        });
        if (declarations.length > 0) {
            return declarations.shift();
        }
    }
    return undefined;
}
exports.findDeclarationNode = findDeclarationNode;
function containsNode(nodeOuter, nodeInner) {
    const outerLoc = nodeOuter.loc;
    const innerLoc = nodeInner.loc;
    return (outerLoc != null &&
        innerLoc != null &&
        isInLoc(innerLoc.start.line, innerLoc.start.column, outerLoc) &&
        isInLoc(innerLoc.end.line, innerLoc.end.column, outerLoc));
}
// This checks if a given (line, col) value is part of another node.
function isInLoc(line, col, location) {
    if (location == null) {
        return false;
    }
    if (location.start.line < line && location.end.line > line) {
        return true;
    }
    else if (location.start.line === line && location.end.line > line) {
        return location.start.column <= col;
    }
    else if (location.start.line < line && location.end.line === line) {
        return location.end.column >= col;
    }
    else if (location.start.line === line && location.end.line === line) {
        if (location.start.column <= col && location.end.column >= col) {
            return true;
        }
        else {
            return false;
        }
    }
    else {
        return false;
    }
}
exports.isInLoc = isInLoc;
function findAncestors(root, identifier) {
    let foundAncestors = [];
    (0, walkers_1.ancestor)(root, {
        Identifier: (node, ancestors) => {
            if (identifier.name === node.name && identifier.loc === node.loc) {
                foundAncestors = Object.assign([], ancestors).reverse();
                foundAncestors.shift(); // Remove the identifier node
            }
        },
        /* We need a separate visitor for VariablePattern because
      acorn walk ignores Identifers on the left side of expressions.
      Here is a github issue in acorn-walk related to this:
      https://github.com/acornjs/acorn/issues/686
      */
        VariablePattern: (node, ancestors) => {
            if (identifier.name === node.name && identifier.loc === node.loc) {
                foundAncestors = Object.assign([], ancestors).reverse();
            }
        }
    }, customWalker);
    return foundAncestors;
}
exports.findAncestors = findAncestors;
const customWalker = Object.assign(Object.assign({}, walkers_1.base), { ImportSpecifier(node, st, c) {
        c(node.imported, st, 'Expression');
    } });
//# sourceMappingURL=finder.js.map