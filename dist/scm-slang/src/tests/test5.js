"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const acorn = require("acorn");
const prelude_visitor_1 = require("../prelude-visitor");
const astring_1 = require("astring");
const tree = acorn.Parser.parse(`
function plus(x, y) {
    return x + y;
}

function minus(x, y) {
    return plus(x) - plus(y);
}

function equalQ(x, y) {
    return x === y;
}

function vector_Gstring(v) {
    return v.toString();
}
`, { ecmaVersion: 2020, sourceType: 'module' });
//preludeModifier(tree);
console.log((0, astring_1.generate)((0, prelude_visitor_1.preludeModifier)(tree)));
//# sourceMappingURL=test5.js.map