"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cddddr = exports.cdddar = exports.cddadr = exports.cddaar = exports.cdaddr = exports.cdadar = exports.cdaadr = exports.cdaaar = exports.cadddr = exports.caddar = exports.cadadr = exports.cadaar = exports.caaddr = exports.caadar = exports.caaadr = exports.caaaar = exports.cdddr = exports.cddar = exports.cdadr = exports.cdaar = exports.caddr = exports.cadar = exports.caadr = exports.caaar = void 0;
const scheme_base_1 = require("./scheme-base");
let caaar = function (x) {
    return (0, scheme_base_1.car)((0, scheme_base_1.car)((0, scheme_base_1.car)(x)));
};
exports.caaar = caaar;
let caadr = function (x) {
    return (0, scheme_base_1.car)((0, scheme_base_1.car)((0, scheme_base_1.cdr)(x)));
};
exports.caadr = caadr;
let cadar = function (x) {
    return (0, scheme_base_1.car)((0, scheme_base_1.cdr)((0, scheme_base_1.car)(x)));
};
exports.cadar = cadar;
let caddr = function (x) {
    return (0, scheme_base_1.car)((0, scheme_base_1.cdr)((0, scheme_base_1.cdr)(x)));
};
exports.caddr = caddr;
let cdaar = function (x) {
    return (0, scheme_base_1.cdr)((0, scheme_base_1.car)((0, scheme_base_1.car)(x)));
};
exports.cdaar = cdaar;
let cdadr = function (x) {
    return (0, scheme_base_1.cdr)((0, scheme_base_1.car)((0, scheme_base_1.cdr)(x)));
};
exports.cdadr = cdadr;
let cddar = function (x) {
    return (0, scheme_base_1.cdr)((0, scheme_base_1.cdr)((0, scheme_base_1.car)(x)));
};
exports.cddar = cddar;
let cdddr = function (x) {
    return (0, scheme_base_1.cdr)((0, scheme_base_1.cdr)((0, scheme_base_1.cdr)(x)));
};
exports.cdddr = cdddr;
let caaaar = function (x) {
    return (0, scheme_base_1.car)((0, scheme_base_1.car)((0, scheme_base_1.car)((0, scheme_base_1.car)(x))));
};
exports.caaaar = caaaar;
let caaadr = function (x) {
    return (0, scheme_base_1.car)((0, scheme_base_1.car)((0, scheme_base_1.car)((0, scheme_base_1.cdr)(x))));
};
exports.caaadr = caaadr;
let caadar = function (x) {
    return (0, scheme_base_1.car)((0, scheme_base_1.car)((0, scheme_base_1.cdr)((0, scheme_base_1.car)(x))));
};
exports.caadar = caadar;
let caaddr = function (x) {
    return (0, scheme_base_1.car)((0, scheme_base_1.car)((0, scheme_base_1.cdr)((0, scheme_base_1.cdr)(x))));
};
exports.caaddr = caaddr;
let cadaar = function (x) {
    return (0, scheme_base_1.car)((0, scheme_base_1.cdr)((0, scheme_base_1.car)((0, scheme_base_1.car)(x))));
};
exports.cadaar = cadaar;
let cadadr = function (x) {
    return (0, scheme_base_1.car)((0, scheme_base_1.cdr)((0, scheme_base_1.car)((0, scheme_base_1.cdr)(x))));
};
exports.cadadr = cadadr;
let caddar = function (x) {
    return (0, scheme_base_1.car)((0, scheme_base_1.cdr)((0, scheme_base_1.cdr)((0, scheme_base_1.car)(x))));
};
exports.caddar = caddar;
let cadddr = function (x) {
    return (0, scheme_base_1.car)((0, scheme_base_1.cdr)((0, scheme_base_1.cdr)((0, scheme_base_1.cdr)(x))));
};
exports.cadddr = cadddr;
let cdaaar = function (x) {
    return (0, scheme_base_1.cdr)((0, scheme_base_1.car)((0, scheme_base_1.car)((0, scheme_base_1.car)(x))));
};
exports.cdaaar = cdaaar;
let cdaadr = function (x) {
    return (0, scheme_base_1.cdr)((0, scheme_base_1.car)((0, scheme_base_1.car)((0, scheme_base_1.cdr)(x))));
};
exports.cdaadr = cdaadr;
let cdadar = function (x) {
    return (0, scheme_base_1.cdr)((0, scheme_base_1.car)((0, scheme_base_1.cdr)((0, scheme_base_1.car)(x))));
};
exports.cdadar = cdadar;
let cdaddr = function (x) {
    return (0, scheme_base_1.cdr)((0, scheme_base_1.car)((0, scheme_base_1.cdr)((0, scheme_base_1.cdr)(x))));
};
exports.cdaddr = cdaddr;
let cddaar = function (x) {
    return (0, scheme_base_1.cdr)((0, scheme_base_1.cdr)((0, scheme_base_1.car)((0, scheme_base_1.car)(x))));
};
exports.cddaar = cddaar;
let cddadr = function (x) {
    return (0, scheme_base_1.cdr)((0, scheme_base_1.cdr)((0, scheme_base_1.car)((0, scheme_base_1.cdr)(x))));
};
exports.cddadr = cddadr;
let cdddar = function (x) {
    return (0, scheme_base_1.cdr)((0, scheme_base_1.cdr)((0, scheme_base_1.cdr)((0, scheme_base_1.car)(x))));
};
exports.cdddar = cdddar;
let cddddr = function (x) {
    return (0, scheme_base_1.cdr)((0, scheme_base_1.cdr)((0, scheme_base_1.cdr)((0, scheme_base_1.cdr)(x))));
};
exports.cddddr = cddddr;
//# sourceMappingURL=scheme-cxr.js.map