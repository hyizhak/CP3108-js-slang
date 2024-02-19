"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRequireProvider = void 0;
const jsslang = require("..");
const stdlib = require("../stdlib");
const types = require("../types");
const stringify = require("../utils/stringify");
/**
 * Returns a function that simulates the job of Node's `require`. The require
 * provider is then used by Source modules to access the context and js-slang standard
 * library
 */
const getRequireProvider = (context) => (x) => {
    const pathSegments = x.split('/');
    const recurser = (obj, segments) => {
        if (segments.length === 0)
            return obj;
        const currObj = obj[segments[0]];
        if (currObj !== undefined)
            return recurser(currObj, segments.splice(1));
        throw new Error(`Dynamic require of ${x} is not supported`);
    };
    const exports = {
        'js-slang': Object.assign(Object.assign({}, jsslang), { dist: {
                stdlib,
                types,
                utils: {
                    stringify
                }
            }, context })
    };
    return recurser(exports, pathSegments);
};
exports.getRequireProvider = getRequireProvider;
//# sourceMappingURL=requireProvider.js.map