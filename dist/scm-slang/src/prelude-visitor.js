"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.preludeModifier = void 0;
const walk = require("acorn-walk");
/*
convention:

_ --> -
E --> = (since all scheme basic procedures are in lower case)
Q --> ?
B --> !
L --> <
G --> >

plus --> +
minus --> -
multiply --> *
divide --> /

to be changed with regex.
*/
let keywords = new Map([
    ["plus", "+"],
    ["minus", "-"],
    ["multiply", "*"],
    ["divide", "/"],
]);
// A function to modify a single name.
function modifyName(name) {
    if (keywords.has(name)) {
        // Safe to cast as we have already
        // checked that the name is in the map.
        return keywords.get(name);
    }
    return name.replace(/_/g, "-").replace(/E/g, "=").replace(/Q/g, "?").replace(/B/g, "!").replace(/L/g, "<").replace(/G/g, ">");
}
// A function to modify all names in the estree program.
// Designed for preludes required by scheme programs.
function preludeModifier(ast) {
    walk.full(ast, (node) => {
        if (node.type === "Identifier") {
            node.name = modifyName(node.name);
        }
    });
    return ast;
}
exports.preludeModifier = preludeModifier;
//# sourceMappingURL=prelude-visitor.js.map