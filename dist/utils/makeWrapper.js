"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeWrapper = void 0;
// tslint:disable-next-line:ban-types
function makeWrapper(originalFunc, wrappedFunc) {
    for (const prop in originalFunc) {
        if (originalFunc.hasOwnProperty(prop)) {
            Object.defineProperty(wrappedFunc, prop, Object.getOwnPropertyDescriptor(originalFunc, prop));
        }
    }
    for (const prop of ['length', 'name']) {
        if (originalFunc.hasOwnProperty(prop)) {
            Object.defineProperty(wrappedFunc, prop, Object.getOwnPropertyDescriptor(originalFunc, prop));
        }
    }
}
exports.makeWrapper = makeWrapper;
//# sourceMappingURL=makeWrapper.js.map