"use strict";
// Delay is defined in the parser itself.
Object.defineProperty(exports, "__esModule", { value: true });
exports.promiseQ = exports.force = void 0;
const force = function (x) {
    return x();
};
exports.force = force;
const promiseQ = function (x) {
    return x instanceof Function && x.length === 0;
};
exports.promiseQ = promiseQ;
//# sourceMappingURL=scheme-lazy.js.map