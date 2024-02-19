"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const acorn_1 = require("acorn");
const fs = require("fs");
const createContext_1 = require("./createContext");
const types_1 = require("./types");
const context = (0, createContext_1.default)(types_1.Chapter.SOURCE_4);
// Generate names.txt
const a = context.nativeStorage.builtins.keys();
const names_file = fs.createWriteStream('sicp_publish/names.txt');
names_file.on('error', function (e) {
    console.log(e);
});
for (const name of a) {
    names_file.write(name + '\n');
}
names_file.end();
// Generate prelude.txt
const prelude_file = fs.createWriteStream('sicp_publish/prelude.txt');
prelude_file.on('error', function (e) {
    console.log(e);
});
prelude_file.write(context.prelude);
prelude_file.end();
// Generate prelude_names.txt
const b = (0, acorn_1.parse)(context.prelude || '', { ecmaVersion: 2020 });
const prelude_names = fs.createWriteStream('sicp_publish/prelude_names.txt');
prelude_names.on('error', function (e) {
    console.log(e);
});
b.body
    .map(node => { var _a; return (_a = node.id) === null || _a === void 0 ? void 0 : _a.name; })
    .map(name => prelude_names.write(name + '\n'));
prelude_names.end();
//# sourceMappingURL=sicp-prepare.js.map