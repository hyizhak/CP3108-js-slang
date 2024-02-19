"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tokenizer_1 = require("../tokenizer");
const str = "this should #|    #|    #| #| |  | | | | | | | # | # | #  |# be evaluated";
const tz = new tokenizer_1.Tokenizer(str);
const tok = tz.scanTokens();
console.log(tok);
//# sourceMappingURL=test0.js.map