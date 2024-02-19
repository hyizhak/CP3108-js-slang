"use strict";
/*
 * Why not use the nodejs builtin assert? It needs polyfills to work in the browser.
 * With this we have a lightweight assert that doesn't need any further packages.
 * Plus, we can customize our own assert messages and handling
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AssertionError = void 0;
const runtimeSourceError_1 = require("../errors/runtimeSourceError");
class AssertionError extends runtimeSourceError_1.RuntimeSourceError {
    constructor(message) {
        super();
        this.message = message;
    }
    explain() {
        return this.message;
    }
    elaborate() {
        return 'Please contact the administrators to let them know that this error has occurred';
    }
}
exports.AssertionError = AssertionError;
function assert(condition, message) {
    if (!condition) {
        throw new AssertionError(message);
    }
}
exports.default = assert;
//# sourceMappingURL=assert.js.map