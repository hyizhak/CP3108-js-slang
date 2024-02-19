"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SourceDocumentation = void 0;
const ext_lib = require("./External libraries.json");
const source_1 = require("./source_1.json");
const source_2 = require("./source_2.json");
const source_3 = require("./source_3.json");
const source_3_concurrent = require("./source_3_concurrent.json");
const source_3_non_det = require("./source_3_non-det.json");
const source_4 = require("./source_4.json");
// (18 March 2022)
// Problem to be fixed in the future:
//
// There seems to be an inconsistency between how jest and how typescript
// behaves when encountering imports of the form `import * as x from 'x.json'`
// jest will set x = jsonobject,
// but typescript will instead set x = { default: jsonobject }
//
// This means that under typescript, we want `import x from 'x.json'`,
// while under jest, we want `import * as x from 'x.json'`
//
// This problem was hidden when transpiling to CommonJS modules before, which
// behaves similarly to jest. But now that we are transpiling to es6,
// typescript projects that depend on js-slang may now be exposed to this
// inconsistency.
//
// For now, we use brute force until the landscape changes or someone thinks of
// a proper solution.
function resolveImportInconsistency(json) {
    // `json` doesn't inherit from `Object`?
    // Can't use hasOwnProperty for some reason.
    if ('default' in json) {
        return json.default;
    }
    else {
        return json;
    }
}
exports.SourceDocumentation = {
    builtins: {
        '1': resolveImportInconsistency(source_1),
        '1_lazy': resolveImportInconsistency(source_1),
        '2': resolveImportInconsistency(source_2),
        '2_lazy': resolveImportInconsistency(source_2),
        '3': resolveImportInconsistency(source_3),
        '3_concurrent': resolveImportInconsistency(source_3_concurrent),
        '3_non-det': resolveImportInconsistency(source_3_non_det),
        '4': resolveImportInconsistency(source_4)
    },
    ext_lib
};
//# sourceMappingURL=index.js.map