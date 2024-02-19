"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
const __1 = require("..");
const astring_1 = require("astring");
/*
const acorn = require("acorn");
const walk = require("acorn-walk");

const glob = readFileSync("./src/lib/scheme-base.ts", "utf8");
const tree = acorn.parse(glob, {ecmaVersion: 2020, sourceType: "module"});

let keywords = new Map<string, string>([
    ["plus", "+"],
    ["minus", "-"],
    ["multiply", "*"],
    ["divide", "/"],
    ["equal", "="],
]);

walk.simple(tree, {
    VariableDeclarator(node: any) {
        if (keywords.has(node.id.name)) {
            node.id.name = keywords.get(node.id.name);
        }
    }
});
*/
const str = (0, fs_1.readFileSync)("./src/tests/alltest.scm", "utf8");
//tree.body.push(...ps.parse().body);
console.log((0, astring_1.generate)((0, __1.schemeParse)(str)));
//# sourceMappingURL=test4.js.map