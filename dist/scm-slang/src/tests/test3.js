"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
const tokenizer_1 = require("../tokenizer");
const parser_1 = require("../parser");
const escodegen = require("escodegen");
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
const str = (0, fs_1.readFileSync)("./src/tests/quotation.scm", "utf8");
const tz = new tokenizer_1.Tokenizer(str);
const tok = tz.scanTokens();
const ps = new parser_1.Parser(str, tok);
//tree.body.push(...ps.parse().body);
console.log(escodegen.generate(ps.parse()));
//# sourceMappingURL=test3.js.map