"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tokenizer_1 = require("../tokenizer");
const fs_1 = require("fs");
const parser_1 = require("../parser");
const astring_1 = require("astring");
const str = (0, fs_1.readFileSync)("./src/tests/test-metacircular-evaluator.scm", "utf8");
const tz = new tokenizer_1.Tokenizer(str);
const tok = tz.scanTokens();
const ps = new parser_1.Parser(str, tok);
console.log((0, astring_1.generate)(ps.parse()));
//# sourceMappingURL=test1.js.map