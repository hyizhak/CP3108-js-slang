"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const __1 = require("..");
const astring_1 = require("astring");
const source_map_1 = require("source-map");
const walk = require("acorn-walk");
function encodeTree(tree) {
    walk.full(tree, (node) => {
        if (node.type === 'Identifier') {
            node.name = (0, __1.encode)(node.name);
        }
    });
    return tree;
}
const estree = (0, __1.schemeParse)("`(a b ())");
const sourceMap = new source_map_1.SourceMapGenerator({ file: 'source' });
console.log((0, astring_1.generate)(estree, { sourceMap }));
console.log((0, astring_1.generate)(encodeTree(estree), { sourceMap }));
//# sourceMappingURL=test6.js.map