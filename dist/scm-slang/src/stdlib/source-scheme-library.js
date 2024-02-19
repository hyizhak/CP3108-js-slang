"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.schemeToString = void 0;
const base = require("./scheme-base");
const list = require("./scheme-list");
//import * as lazy from "./scheme-lazy";
//import * as cxr from "./scheme-cxr";
__exportStar(require("./scheme-base"), exports);
__exportStar(require("./scheme-list"), exports);
__exportStar(require("./scheme-lazy"), exports);
__exportStar(require("./scheme-cxr"), exports);
// Extracts the arguments from a function as a string array.
// Taken from https://stackoverflow.com/questions/1007981/how-to-get-function-parameter-names-values-dynamically-from-javascript
// Adapted to work on both arrow functions and default functions.
function $args(func) {
    return (func + "")
        .replace(/[/][/].*$/gm, "") // strip single-line comments
        .replace(/\s+/g, "") // strip white space
        .replace(/[/][*][^/*]*[*][/]/g, "") // strip multi-line comments
        .split(")", 1)[0] // In case of a default/arrow function, extract the parameters
        .replace(/^[^(]*[(]/, "") // extract the parameters
        .replace(/=[^,]+/g, "") // strip any ES6 defaults
        .split(",")
        .filter(Boolean); // split & filter [""]
}
// Display is defined in js-slang. This helps to format whatever scheme creates first.
function schemeToString(x) {
    let str = "";
    if (x === undefined) {
        str = 'undefined';
    }
    else if (base.listQ(x)) {
        str = "(";
        let p = x;
        while (p !== null) {
            str += schemeToString(p.car);
            p = p.cdr;
            if (p !== null) {
                str += " ";
            }
        }
        str += ")";
    }
    else if (list.dotted_listQ(x) && base.pairQ(x)) {
        str = "(";
        let p = x;
        while (base.pairQ(p)) {
            str = `${str}${schemeToString(p.car)} `;
            p = p.cdr;
        }
        str = `${str}. ${schemeToString(p)})`;
    }
    else if (base.vectorQ(x)) {
        str = "#(";
        let v = x;
        for (let i = 0; i < v.vec.length; i++) {
            str += schemeToString(v.vec[i]);
            if (i !== v.vec.length - 1) {
                str += " ";
            }
        }
        str += ")";
    }
    else if (base.procedureQ(x)) {
        str = `#<procedure (${$args(x)
            .reduce((a, b) => `${a} ${b.replace('...', '. ')}`, "")
            .trimStart()})>`;
    }
    else if (base.booleanQ(x)) {
        str = x ? "#t" : "#f";
    }
    else {
        str = x.toString();
    }
    return str;
}
exports.schemeToString = schemeToString;
;
//# sourceMappingURL=source-scheme-library.js.map