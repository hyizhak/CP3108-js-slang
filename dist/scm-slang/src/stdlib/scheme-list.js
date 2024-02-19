"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reduce_right = exports.reduce = exports.fold_right = exports.fold = exports.filter = exports.dotted_listQ = void 0;
const scheme_base_1 = require("./scheme-base");
let dotted_listQ = function (list) {
    if (list === null) {
        return false;
    }
    else if (list.cdr === null) {
        return false;
    }
    else if (list.cdr instanceof scheme_base_1.Pair) {
        return (0, exports.dotted_listQ)(list.cdr);
    }
    else {
        return true;
    }
};
exports.dotted_listQ = dotted_listQ;
let filter = function (predicate, list) {
    if (list === null) {
        return null;
    }
    else if (predicate(list.car)) {
        return new scheme_base_1.Pair(list.car, (0, exports.filter)(predicate, list.cdr));
    }
    else {
        return (0, exports.filter)(predicate, list.cdr);
    }
};
exports.filter = filter;
let fold = function (f, init, ...lists) {
    if (lists.length === 0) {
        return init;
    }
    if (f.length !== lists.length + 1) {
        throw new Error(`Wrong number of arguments to accumulator: expected ${lists.length + 1}, got ${f.length}`);
    }
    if (lists.some((list) => list === null)) {
        return init;
    }
    else {
        return (0, exports.fold)(f, f(init, ...lists.map((list) => list.car)), ...lists.map((list) => list.cdr));
    }
};
exports.fold = fold;
let fold_right = function (f, init, ...lists) {
    if (lists.length === 0) {
        return init;
    }
    if (f.length !== lists.length + 1) {
        throw new Error(`Wrong number of arguments to accumulator: expected ${lists.length + 1}, got ${f.length}`);
    }
    if (lists.some((list) => list === null)) {
        return init;
    }
    else {
        return f(...lists.map((list) => list.car), (0, exports.fold_right)(f, init, ...lists.map((list) => list.cdr)));
    }
};
exports.fold_right = fold_right;
let reduce = function (f, rIdentity, list) {
    if (list === null) {
        return rIdentity;
    }
    if (f.length !== 2) {
        throw new Error(`Wrong number of arguments to accumulator: expected 2 got ${f.length}`);
    }
    else {
        return (0, exports.fold)(f, rIdentity, list);
    }
};
exports.reduce = reduce;
let reduce_right = function (f, rIdentity, list) {
    if (list === null) {
        return rIdentity;
    }
    if (f.length !== 2) {
        throw new Error(`Wrong number of arguments to accumulator: expected 2, got ${f.length}`);
    }
    else {
        return (0, exports.fold_right)(f, rIdentity, list);
    }
};
exports.reduce_right = reduce_right;
//# sourceMappingURL=scheme-list.js.map