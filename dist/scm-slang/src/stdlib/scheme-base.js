"use strict";
/*
convention:

_ --> -
E --> = (since all scheme basic procedures are in lower case)
Q --> ?
B --> !
L --> <
G --> >

to be changed with regex.
*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.booleanEQ = exports.booleanQ = exports.not = exports.or = exports.and = exports.$true = exports.string_Gnumber = exports.number_Gstring = exports.exact = exports.inexact = exports.expt = exports.exact_integer_sqrt = exports.square = exports.rationalize = exports.round = exports.truncate = exports.ceiling = exports.floor = exports.lcm = exports.gcd = exports.remainder = exports.modulo = exports.quotient = exports.abs = exports.divide = exports.minus = exports.multiply = exports.plus = exports.min = exports.max = exports.evenQ = exports.oddQ = exports.negativeQ = exports.positiveQ = exports.zeroQ = exports.GE = exports.LE = exports.G = exports.L = exports.E = exports.exact_integerQ = exports.exactQ = exports.integerQ = exports.rationalQ = exports.realQ = exports.complexQ = exports.numberQ = exports.equalQ = exports.eqvQ = exports.eqQ = void 0;
exports.string_copy = exports.list_Gstring = exports.string_Glist = exports.string_append = exports.substring = exports.stringGEQ = exports.stringLEQ = exports.stringGQ = exports.stringLQ = exports.stringEQ = exports.string_setB = exports.string_ref = exports.string_length = exports.string = exports.make_string = exports.stringQ = exports.string_Gsymbol = exports.symbol_Gstring = exports.symbolEQ = exports.symbolQ = exports._Symbol = exports.list_copy = exports.assoc = exports.assv = exports.assq = exports.member = exports.memv = exports.memq = exports.list_setB = exports.list_ref = exports.list_tail = exports.reverse = exports.append = exports.length = exports.list = exports.make_list = exports.listQ = exports.nullQ = exports.cddr = exports.cdar = exports.cadr = exports.caar = exports.set_cdrB = exports.set_carB = exports.cdr = exports.car = exports.cons = exports.pairQ = exports.Pair = exports.$list_to_array = void 0;
exports.newline = exports.error = exports.map = exports.apply = exports.procedureQ = exports.vector_fillB = exports.vector_append = exports.vector_copyB = exports.vector_copy = exports.string_Gvector = exports.vector_Gstring = exports.list_Gvector = exports.vector_Glist = exports.vector_setB = exports.vector_ref = exports.vector_length = exports.vector = exports.make_vector = exports.vectorQ = exports.Vector = exports.string_for_each = exports.string_map = exports.string_fillB = exports.string_copyB = void 0;
// Equivalence predicates
let eqQ = function (x, y) {
    if (x instanceof _Symbol && y instanceof _Symbol) {
        return x.sym === y.sym;
    }
    return x === y;
};
exports.eqQ = eqQ;
let eqvQ = function (x, y) {
    if (x === y) {
        return true;
    }
    else if (typeof x === "number" && typeof y === "number") {
        return isNaN(x) && isNaN(y);
    }
    else if (x instanceof _Symbol && y instanceof _Symbol) {
        return x.sym === y.sym;
    }
    else {
        return false;
    }
};
exports.eqvQ = eqvQ;
let equalQ = function (x, y) {
    if (x === y) {
        return true;
    }
    else if (typeof x === "number" && typeof y === "number") {
        return isNaN(x) && isNaN(y);
    }
    else if (x instanceof Pair && y instanceof Pair) {
        return (0, exports.equalQ)(x.car, y.car) && (0, exports.equalQ)(x.cdr, y.cdr);
    }
    else if (x instanceof _Symbol && y instanceof _Symbol) {
        return x.sym === y.sym;
    }
    else {
        return false;
    }
};
exports.equalQ = equalQ;
// Numbers
let numberQ = function (n) {
    return typeof n === "number";
};
exports.numberQ = numberQ;
let complexQ = function (n) {
    return typeof n === "number";
};
exports.complexQ = complexQ;
let realQ = function (n) {
    return typeof n === "number";
};
exports.realQ = realQ;
let rationalQ = function (n) {
    return typeof n === "number";
};
exports.rationalQ = rationalQ;
let integerQ = function (n) {
    return typeof n === "number" && n % 1 === 0;
};
exports.integerQ = integerQ;
let exactQ = function (n) {
    return typeof n === "number" && n % 1 === 0;
};
exports.exactQ = exactQ;
let exact_integerQ = function (n) {
    return typeof n === "number" && n % 1 === 0;
};
exports.exact_integerQ = exact_integerQ;
let E = function (...args) {
    let acc = true;
    for (let i = 0; i < args.length - 1; i++) {
        if (!(0, exports.numberQ)(args[i])) {
            throw new Error("procedure =: expected number, got " + args[i].toString());
        }
        acc = acc && args[i] === args[i + 1];
    }
    return acc;
};
exports.E = E;
let L = function (...args) {
    let acc = true;
    for (let i = 0; i < args.length - 1; i++) {
        if (!(0, exports.numberQ)(args[i])) {
            throw new Error("procedure <: expected number, got " + args[i].toString());
        }
        acc = acc && args[i] < args[i + 1];
    }
    return acc;
};
exports.L = L;
let G = function (...args) {
    let acc = true;
    for (let i = 0; i < args.length - 1; i++) {
        if (!(0, exports.numberQ)(args[i])) {
            throw new Error("procedure >: expected number, got " + args[i].toString());
        }
        acc = acc && args[i] > args[i + 1];
    }
    return acc;
};
exports.G = G;
let LE = function (...args) {
    let acc = true;
    for (let i = 0; i < args.length - 1; i++) {
        if (!(0, exports.numberQ)(args[i])) {
            throw new Error("procedure <=: expected number, got " + args[i].toString());
        }
        acc = acc && args[i] <= args[i + 1];
    }
    return acc;
};
exports.LE = LE;
let GE = function (...args) {
    let acc = true;
    for (let i = 0; i < args.length - 1; i++) {
        if (!(0, exports.numberQ)(args[i])) {
            throw new Error("procedure >=: expected number, got " + args[i].toString());
        }
        acc = acc && args[i] >= args[i + 1];
    }
    return acc;
};
exports.GE = GE;
let zeroQ = function (n) {
    return (0, exports.E)(n, 0);
};
exports.zeroQ = zeroQ;
let positiveQ = function (n) {
    return (0, exports.G)(n, 0);
};
exports.positiveQ = positiveQ;
let negativeQ = function (n) {
    return (0, exports.L)(n, 0);
};
exports.negativeQ = negativeQ;
let oddQ = function (n) {
    if (!(0, exports.numberQ)(n)) {
        throw new Error("procedure odd?: expected number, got " + n.toString());
    }
    return n % 2 !== 0;
};
exports.oddQ = oddQ;
let evenQ = function (n) {
    if (!(0, exports.numberQ)(n)) {
        throw new Error("procedure even?: expected number, got " + n.toString());
    }
    return n % 2 === 0;
};
exports.evenQ = evenQ;
let max = function (...args) {
    return Math.max(...args);
};
exports.max = max;
let min = function (...args) {
    return Math.min(...args);
};
exports.min = min;
let plus = function (...args) {
    return args.reduce((a, b) => a + b, 0);
};
exports.plus = plus;
let multiply = function (...args) {
    return args.reduce((a, b) => a * b, 1);
};
exports.multiply = multiply;
let minus = function (...args) {
    if (args.length < 2) {
        return -args[0];
    }
    return args.slice(1).reduce((a, b) => a - b, args[0]);
};
exports.minus = minus;
let divide = function (...args) {
    if (args.length < 2) {
        return 1 / args[0];
    }
    return args.slice(1).reduce((a, b) => a / b, args[0]);
};
exports.divide = divide;
let abs = function (x) {
    return Math.abs(x);
};
exports.abs = abs;
let quotient = function (x, y) {
    return Math.trunc(x / y);
};
exports.quotient = quotient;
let modulo = function (x, y) {
    return x % y;
};
exports.modulo = modulo;
let remainder = function (x, y) {
    return x % y;
};
exports.remainder = remainder;
let gcd = function (...args) {
    return args.reduce((a, b) => {
        if (a === 0) {
            return (0, exports.abs)(b);
        }
        return (0, exports.gcd)((0, exports.abs)(b % a), (0, exports.abs)(a));
    }, 0);
};
exports.gcd = gcd;
let lcm = function (...args) {
    return args.reduce((a, b) => {
        return (0, exports.abs)(a * b) / (0, exports.gcd)(a, b);
    }, 1);
};
exports.lcm = lcm;
let floor = function (x) {
    return Math.floor(x);
};
exports.floor = floor;
let ceiling = function (x) {
    return Math.ceil(x);
};
exports.ceiling = ceiling;
let truncate = function (x) {
    return Math.trunc(x);
};
exports.truncate = truncate;
let round = function (x) {
    return Math.round(x);
};
exports.round = round;
let rationalize = function (x, y) {
    return x / y;
};
exports.rationalize = rationalize;
let square = function (x) {
    return x * x;
};
exports.square = square;
let exact_integer_sqrt = function (x) {
    return Math.sqrt(x);
};
exports.exact_integer_sqrt = exact_integer_sqrt;
let expt = function (x, y) {
    return Math.pow(x, y);
};
exports.expt = expt;
let inexact = function (x) {
    return x;
};
exports.inexact = inexact;
let exact = function (x) {
    return x;
};
exports.exact = exact;
let number_Gstring = function (x) {
    return x.toString();
};
exports.number_Gstring = number_Gstring;
let string_Gnumber = function (x) {
    return Number(x);
};
exports.string_Gnumber = string_Gnumber;
// Booleans
// Important value for the interpreter: 
// As truthy and falsy values in Scheme are different
// from JavaScript, this will convert the value to Scheme's truthy value.
const $true = function (b) {
    if (b === false) {
        return false;
    }
    return true;
};
exports.$true = $true;
let and = function (...args) {
    return args.reduce((a, b) => (0, exports.$true)(a) && b, true);
};
exports.and = and;
let or = function (...args) {
    return args.reduce((a, b) => (0, exports.$true)(a) || b, false);
};
exports.or = or;
let not = function (b) {
    if (b === false) {
        return true;
    }
    return false;
};
exports.not = not;
let booleanQ = function (b) {
    return b === true || b === false;
};
exports.booleanQ = booleanQ;
let booleanEQ = function (b1, b2) {
    return b1 === b2;
};
exports.booleanEQ = booleanEQ;
// Pairs
// Special function needed by base scm-slang
// to work with lists.
const $list_to_array = function (l) {
    let acc = [];
    while (!(0, exports.nullQ)(l)) {
        acc.push((0, exports.car)(l));
        l = (0, exports.cdr)(l);
    }
    return acc;
};
exports.$list_to_array = $list_to_array;
class Pair {
    constructor(car, cdr) {
        this.car = car;
        this.cdr = cdr;
    }
    toString() {
        return `(${this.car} . ${this.cdr})`;
    }
}
exports.Pair = Pair;
let pairQ = function (p) {
    return p instanceof Pair;
};
exports.pairQ = pairQ;
let cons = function (car, cdr) {
    return new Pair(car, cdr);
};
exports.cons = cons;
let car = function (p) {
    if (p === null) {
        (0, exports.error)("car: null pair");
    }
    return p.car;
};
exports.car = car;
let cdr = function (p) {
    if (p === null) {
        (0, exports.error)("cdr: null pair");
    }
    return p.cdr;
};
exports.cdr = cdr;
let set_carB = function (p, val) {
    if (p === null) {
        (0, exports.error)("set-car!: null pair");
    }
    p.car = val;
};
exports.set_carB = set_carB;
let set_cdrB = function (p, val) {
    if (p === null) {
        (0, exports.error)("set-cdr!: null pair");
    }
    p.cdr = val;
};
exports.set_cdrB = set_cdrB;
let caar = function (p) {
    return p.car.car;
};
exports.caar = caar;
let cadr = function (p) {
    return p.cdr.car;
};
exports.cadr = cadr;
let cdar = function (p) {
    return p.car.cdr;
};
exports.cdar = cdar;
let cddr = function (p) {
    return p.cdr.cdr;
};
exports.cddr = cddr;
let nullQ = function (p) {
    return p === null;
};
exports.nullQ = nullQ;
let listQ = function (p) {
    return p === null ? true : p instanceof Pair && (0, exports.listQ)(p.cdr);
};
exports.listQ = listQ;
let make_list = function (n, val = null) {
    let acc = null;
    for (let i = 0; i < n; i++) {
        acc = new Pair(val, acc);
    }
    return acc;
};
exports.make_list = make_list;
let list = function (...args) {
    let acc = null;
    for (let i = args.length - 1; i >= 0; i--) {
        acc = new Pair(args[i], acc);
    }
    return acc;
};
exports.list = list;
let length = function (p) {
    let acc = 0;
    while (p !== null) {
        acc++;
        p = p.cdr;
    }
    return acc;
};
exports.length = length;
let append = function (...args) {
    if (args.length === 0) {
        return null;
    }
    else if (args.length === 1) {
        return args[0];
    }
    else {
        if (args[0] === null) {
            return (0, exports.append)(...args.slice(1));
        }
        else {
            return (0, exports.cons)((0, exports.car)(args[0]), (0, exports.append)((0, exports.cdr)(args[0]), ...args.slice(1)));
        }
    }
};
exports.append = append;
let reverse = function (p) {
    let acc = null;
    while (p !== null) {
        acc = new Pair(p.car, acc);
        p = p.cdr;
    }
    return acc;
};
exports.reverse = reverse;
let list_tail = function (p, n) {
    if (n === 0) {
        return p;
    }
    else {
        return (0, exports.list_tail)(p.cdr, n - 1);
    }
};
exports.list_tail = list_tail;
let list_ref = function (p, n) {
    return (0, exports.car)((0, exports.list_tail)(p, n));
};
exports.list_ref = list_ref;
let list_setB = function (p, n, val) {
    (0, exports.set_carB)((0, exports.list_tail)(p, n), val);
};
exports.list_setB = list_setB;
let memq = function (item, p) {
    if (p === null) {
        return false;
    }
    else if ((0, exports.eqQ)(p.car, item)) {
        return p;
    }
    else {
        return (0, exports.memq)(item, p.cdr);
    }
};
exports.memq = memq;
let memv = function (item, p) {
    if (p === null) {
        return false;
    }
    else if ((0, exports.eqvQ)(p.car, item)) {
        return p;
    }
    else {
        return (0, exports.memv)(item, p.cdr);
    }
};
exports.memv = memv;
let member = function (item, p) {
    if (p === null) {
        return false;
    }
    else if ((0, exports.equalQ)(p.car, item)) {
        return p;
    }
    else {
        return (0, exports.member)(item, p.cdr);
    }
};
exports.member = member;
let assq = function (item, p) {
    if (p === null) {
        return false;
    }
    else if ((0, exports.eqQ)(p.car.car, item)) {
        return p.car;
    }
    else {
        return (0, exports.assq)(item, p.cdr);
    }
};
exports.assq = assq;
let assv = function (item, p) {
    if (p === null) {
        return false;
    }
    else if ((0, exports.eqvQ)(p.car.car, item)) {
        return p.car;
    }
    else {
        return (0, exports.assv)(item, p.cdr);
    }
};
exports.assv = assv;
let assoc = function (item, p) {
    if (p === null) {
        return false;
    }
    else if ((0, exports.equalQ)(p.car.car, item)) {
        return p.car;
    }
    else {
        return (0, exports.assoc)(item, p.cdr);
    }
};
exports.assoc = assoc;
let list_copy = function (p) {
    if (p === null) {
        return null;
    }
    else {
        return (0, exports.cons)(p.car, (0, exports.list_copy)(p.cdr));
    }
};
exports.list_copy = list_copy;
// Symbols
class _Symbol {
    constructor(sym) {
        this.sym = sym;
    }
    toString() {
        return this.sym;
    }
    equals(other) {
        return other instanceof _Symbol && this.sym === other.sym;
    }
}
exports._Symbol = _Symbol;
let symbolQ = function (s) {
    return s instanceof _Symbol;
};
exports.symbolQ = symbolQ;
let symbolEQ = function (s1, s2) {
    return s1 instanceof _Symbol && s2 instanceof _Symbol && s1.equals(s2);
};
exports.symbolEQ = symbolEQ;
let symbol_Gstring = function (s) {
    return s.sym;
};
exports.symbol_Gstring = symbol_Gstring;
let string_Gsymbol = function (s) {
    return new _Symbol(s);
};
exports.string_Gsymbol = string_Gsymbol;
// Strings
let stringQ = function (s) {
    return typeof s === "string";
};
exports.stringQ = stringQ;
let make_string = function (n, ch = " ") {
    let acc = "";
    for (let i = 0; i < n; i++) {
        acc += ch;
    }
    return acc;
};
exports.make_string = make_string;
let string = function (...args) {
    return args.join("");
};
exports.string = string;
let string_length = function (s) {
    return s.length;
};
exports.string_length = string_length;
let string_ref = function (s, n) {
    return s[n];
};
exports.string_ref = string_ref;
// Immutable strings. this does not work.
let string_setB = function (s, n, ch) {
    //s[n] = ch;
};
exports.string_setB = string_setB;
let stringEQ = function (s1, s2) {
    return s1 === s2;
};
exports.stringEQ = stringEQ;
let stringLQ = function (s1, s2) {
    return s1 < s2;
};
exports.stringLQ = stringLQ;
let stringGQ = function (s1, s2) {
    return s1 > s2;
};
exports.stringGQ = stringGQ;
let stringLEQ = function (s1, s2) {
    return s1 <= s2;
};
exports.stringLEQ = stringLEQ;
let stringGEQ = function (s1, s2) {
    return s1 >= s2;
};
exports.stringGEQ = stringGEQ;
let substring = function (s, start, end = s.length) {
    return s.slice(start, end);
};
exports.substring = substring;
let string_append = function (...args) {
    return args.join("");
};
exports.string_append = string_append;
let string_Glist = function (s) {
    let acc = null;
    for (let i = s.length - 1; i >= 0; i--) {
        acc = new Pair(s[i], acc);
    }
    return acc;
};
exports.string_Glist = string_Glist;
let list_Gstring = function (p) {
    let acc = "";
    while (p !== null) {
        acc += p.car;
        p = p.cdr;
    }
    return acc;
};
exports.list_Gstring = list_Gstring;
let string_copy = function (s) {
    return s;
};
exports.string_copy = string_copy;
// Does nothing.
let string_copyB = function (s) {
    return s;
};
exports.string_copyB = string_copyB;
// Does nothing.
let string_fillB = function (s, ch) {
    for (let i = 0; i < s.length; i++) {
        //s[i] = ch;
    }
};
exports.string_fillB = string_fillB;
let string_map = function (f, s) {
    let acc = "";
    for (let i = 0; i < s.length; i++) {
        acc += f(s[i]);
    }
    return acc;
};
exports.string_map = string_map;
let string_for_each = function (f, s) {
    for (let i = 0; i < s.length; i++) {
        f(s[i]);
    }
};
exports.string_for_each = string_for_each;
// Vectors
class Vector {
    constructor(vec) {
        this.vec = vec;
    }
    toString() {
        return "#(" + this.vec.join(" ") + ")";
    }
    equals(other) {
        return other instanceof Vector && this.vec === other.vec;
    }
}
exports.Vector = Vector;
let vectorQ = function (v) {
    return v instanceof Vector;
};
exports.vectorQ = vectorQ;
let make_vector = function (n, fill = null) {
    let acc = [];
    for (let i = 0; i < n; i++) {
        acc.push(fill);
    }
    return new Vector(acc);
};
exports.make_vector = make_vector;
let vector = function (...args) {
    return new Vector(args);
};
exports.vector = vector;
let vector_length = function (v) {
    return v.vec.length;
};
exports.vector_length = vector_length;
let vector_ref = function (v, n) {
    return v.vec[n];
};
exports.vector_ref = vector_ref;
let vector_setB = function (v, n, item) {
    v.vec[n] = item;
};
exports.vector_setB = vector_setB;
let vector_Glist = function (v) {
    let acc = null;
    for (let i = v.vec.length - 1; i >= 0; i--) {
        acc = new Pair(v.vec[i], acc);
    }
    return acc;
};
exports.vector_Glist = vector_Glist;
let list_Gvector = function (p) {
    let acc = [];
    while (p !== null) {
        acc.push(p.car);
        p = p.cdr;
    }
    return new Vector(acc);
};
exports.list_Gvector = list_Gvector;
let vector_Gstring = function (v) {
    let acc = "";
    for (let i = 0; i < v.vec.length; i++) {
        acc += v.vec[i];
    }
    return acc;
};
exports.vector_Gstring = vector_Gstring;
let string_Gvector = function (s) {
    let acc = [];
    for (let i = 0; i < s.length; i++) {
        acc.push(s[i]);
    }
    return new Vector(acc);
};
exports.string_Gvector = string_Gvector;
let vector_copy = function (v) {
    return new Vector(v.vec);
};
exports.vector_copy = vector_copy;
// Does nothing.
let vector_copyB = function (v) {
    return new Vector(v.vec);
};
exports.vector_copyB = vector_copyB;
let vector_append = function (...args) {
    let acc = [];
    for (let i = 0; i < args.length; i++) {
        acc = acc.concat(args[i].vec);
    }
    return new Vector(acc);
};
exports.vector_append = vector_append;
let vector_fillB = function (v, fill) {
    for (let i = 0; i < v.vec.length; i++) {
        v.vec[i] = fill;
    }
};
exports.vector_fillB = vector_fillB;
// Control features
let procedureQ = function (p) {
    return typeof p === "function";
};
exports.procedureQ = procedureQ;
let apply = function (proc, ...args) {
    if (!(0, exports.pairQ)(args[args.length - 1])) {
        throw new Error("Last argument to apply must be a list");
    }
    let last = args.pop();
    args = args.concat((0, exports.$list_to_array)(last));
    return proc(...args);
};
exports.apply = apply;
let map = function (proc, ...args) {
    const arg = [];
    for (let j = 0; j < args.length; j++) {
        if (args[j] === null) {
            return null;
        }
        arg.push((0, exports.car)(args[j]));
        args[j] = (0, exports.cdr)(args[j]);
    }
    return (0, exports.cons)(proc(...arg), (0, exports.map)(proc, ...args));
};
exports.map = map;
// Exception handling
let error = function (msg) {
    throw new Error(msg);
};
exports.error = error;
// Environments and evaluation
// Input and output
let newline = function () {
    console.log();
};
exports.newline = newline;
//# sourceMappingURL=scheme-base.js.map