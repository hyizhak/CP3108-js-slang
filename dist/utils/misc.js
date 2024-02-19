"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.timeoutPromise = exports.PromiseTimeoutError = void 0;
const runtimeSourceError_1 = require("../errors/runtimeSourceError");
class PromiseTimeoutError extends runtimeSourceError_1.RuntimeSourceError {
}
exports.PromiseTimeoutError = PromiseTimeoutError;
const timeoutPromise = (promise, timeout) => new Promise((resolve, reject) => {
    const timeoutid = setTimeout(() => reject(new PromiseTimeoutError()), timeout);
    promise
        .then(res => {
        clearTimeout(timeoutid);
        resolve(res);
    })
        .catch(e => {
        clearTimeout(timeoutid);
        reject(e);
    });
});
exports.timeoutPromise = timeoutPromise;
//# sourceMappingURL=misc.js.map