"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sandboxedEval = void 0;
const constants_1 = require("../constants");
/*
  We need to use new Function here to ensure that the parameter names do not get
  minified, as the transpiler uses NATIVE_STORAGE_ID for access
 */
exports.sandboxedEval = new Function('code', constants_1.REQUIRE_PROVIDER_ID, constants_1.NATIVE_STORAGE_ID, `
  if (${constants_1.NATIVE_STORAGE_ID}.evaller === null) {
    return eval(code);
  } else {
    return ${constants_1.NATIVE_STORAGE_ID}.evaller(code);
  }
`);
//# sourceMappingURL=evalContainer.js.map