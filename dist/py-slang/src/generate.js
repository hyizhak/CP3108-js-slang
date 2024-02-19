"use strict";
/*
* Script to autogenerate our things.
*
* So far it's just the AST data types that need generating.
* */
Object.defineProperty(exports, "__esModule", { value: true });
const generate_ast_1 = require("./generate-ast");
const writer = new generate_ast_1.AstWriter();
writer.main();
//# sourceMappingURL=generate.js.map