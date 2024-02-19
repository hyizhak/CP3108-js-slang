"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generatePrimitiveFunctionCode = exports.CONSTANT_PRIMITIVES = exports.EXTERNAL_PRIMITIVES = exports.BINARY_PRIMITIVES = exports.UNARY_PRIMITIVES = exports.NULLARY_PRIMITIVES = exports.INTERNAL_FUNCTIONS = exports.VARARGS_NUM_ARGS = exports.PRIMITIVE_FUNCTION_NAMES = exports.vmPrelude = void 0;
const opcodes_1 = require("../vm/opcodes");
const misc_1 = require("./misc");
// functions should be sorted in alphabetical order. Refer to SVML spec on wiki
// placeholders should be manually replaced with the correct machine code.
// customs require slight modification to the generated code, which is automated
// in the function calls below.
// added _ in front of every function name so that function calls
// use CALLP instead of CALL when compiled.
exports.vmPrelude = `
// 0
function _accumulate(f, initial, xs) {
  return is_null(xs) ? initial : f(head(xs), accumulate(f, initial, tail(xs)));
}

// 1
function _append(xs, ys) {
  return is_null(xs) ? ys : pair(head(xs), append(tail(xs), ys));
}

// 2 placeholder
function _array_length(arr) {}

// 3
function _build_list(fun, n) {
  function build(i, fun, already_built) {
    return i < 0 ? already_built : build(i - 1, fun, pair(fun(i), already_built));
  }
  return build(n - 1, fun, null);
}

// 4
function _build_stream(n, fun) {
  function build(i) {
    return i >= n
      ? null
      : pair(fun(i),
        () => build(i + 1));
  }
  return build(0);
}

// 5 custom
// replace MODG opcode (25) with display opcode
// change number of arguments to varargs (-1)
function _display(args) {
  // display(args[0], args[1]);
  // compile this instead for easier replacing
  if (array_length(args) === 0) {
    error('Expected 1 or more arguments, but got ' + stringify(array_length(args)) + '.');
  } else {
    return args[0] % args[1];
  }
}

// 6 custom
// following math_hypot's implementation style
// using the ... operator on the machine
// change number of arguments to varargs (-1)
// replace NOTG opcode with DRAW_DATA opcode
function _draw_data(args) {
  if (array_length(args) === 0) {
    error('Expected 1 or more arguments, but got ' + stringify(array_length(args)) + '.');
  } else {
    !args;
    return args[0];
  }
}

// 7
function _enum_list(start, end) {
  return start > end ? null : pair(start, enum_list(start + 1, end));
}

// 8
function _enum_stream(start, end) {
  return start > end
    ? null
    : pair(start,
      () => enum_stream(start + 1, end));
}

// 9
function _equal(x, y) {
  return is_pair(x) && is_pair(y) ? equal(head(x), head(y)) && equal(tail(x), tail(y)) : x === y;
}

// 10 custom
// replace MODG opcode (25) with error opcode
// change number of arguments to varargs (-1)
function _error(args) {
  // error(args[0], args[1]);
  // compile this instead for easier replacing
  return args[0] % args[1];
}

// 11
function _eval_stream(s, n) {
  return n === 0
    ? null
    : pair(head(s),
      eval_stream(stream_tail(s),
        n - 1));
}

// 12
function _filter(pred, xs) {
  return is_null(xs)
    ? xs
    : pred(head(xs))
    ? pair(head(xs), filter(pred, tail(xs)))
    : filter(pred, tail(xs));
}

// 13
function _for_each(fun, xs) {
  if (is_null(xs)) {
    return true;
  } else {
    fun(head(xs));
    return for_each(fun, tail(xs));
  }
}

// 14
function _head(xs) {
  if (!is_pair(xs)) {
    error('head(xs) expects a pair as argument xs, but encountered ' + stringify(xs));
  } else {
    return xs[0];
  }
}

// 15
function _integers_from(n) {
  return pair(n,
    () => integers_from(n + 1));
}

// 16 placeholder
function _is_array(x) {}

// 17 placeholder
function _is_boolean(x) {}

// 18 placeholder
function _is_function(x) {}

// 19
function _is_list(xs) {
  return is_null(xs) || (is_pair(xs) && is_list(tail(xs)));
}

// 20 placeholder
function _is_null(x) {}

// 21 placeholder
function _is_number(x) {}

// 22
function _is_pair(x) {
  return is_array(x) && array_length(x) === 2;
}

// 23
function _is_stream(xs) {
  return is_null(xs) ||
    (is_pair(xs) &&
    is_function(tail(xs)) &&
    arity(tail(xs)) === 0 &&
    is_stream(stream_tail(xs)));
}

// 24 placeholder
function _is_string(x) {}

// 25 placeholder
function _is_undefined(x) {}

// 26
function _length(xs) {
  return is_null(xs) ? 0 : 1 + length(tail(xs));
}

// 27 custom
// change number of arguments to varargs (-1)
function _list(args) {
  let i = array_length(args) - 1;
  let p = null;
  while (i >= 0) {
    p = pair(args[i], p);
    i = i - 1;
  }
  return p;
}

// 28
function _list_ref(xs, n) {
  return n === 0 ? head(xs) : list_ref(tail(xs), n - 1);
}

// 29
function _list_to_stream(xs) {
  return is_null(xs)
    ? null
    : pair(head(xs),
      () => list_to_stream(tail(xs)));
}

// 30
function _list_to_string(xs) {
    return is_null(xs)
        ? "null"
        : is_pair(xs)
            ? "[" + list_to_string(head(xs)) + "," +
                list_to_string(tail(xs)) + "]"
            : stringify(xs);
}

// 31
function _map(f, xs) {
  return is_null(xs) ? null : pair(f(head(xs)), map(f, tail(xs)));
}

// 32 placeholder
function _math_abs(xs) {}

// 33 placeholder
function _math_acos(xs) {}

// 34 placeholder
function _math_acosh(xs) {}

// 35 placeholder
function _math_asin(xs) {}

// 36 placeholder
function _math_asinh(xs) {}

// 37 placeholder
function _math_atan(xs) {}

// 38 placeholder
function _math_atan2(xs) {}

// 39 placeholder
function _math_atanh(xs) {}

// 40 placeholder
function _math_cbrt(xs) {}

// 41 placeholder
function _math_ceil(xs) {}

// 42 placeholder
function _math_clz32(xs) {}

// 43 placeholder
function _math_cos(xs) {}

// 44 placeholder
function _math_cosh(xs) {}

// 45 placeholder
function _math_exp(xs) {}

// 46 placeholder
function _math_expm1(xs) {}

// 47 placeholder
function _math_floor(xs) {}

// 48 placeholder
function _math_fround(xs) {}

// 49 custom
// can't think of a way to deal with math_hypot
// without incurring a lot of redundant function calls
// so just using the ... operator instead on the machine
// change number of arguments to varargs (-1)
// replace NOTG opcode with MATH_HYPOT opcode
function _math_hypot(args) {
  // compile this instead for easier replacing
  return !args;
}

// 50 placeholder
function _math_imul(xs) {}

// 51 placeholder
function _math_log(xs) {}

// 52 placeholder
function _math_log1p(xs) {}

// 53 placeholder
function _math_log2(xs) {}

// 54 placeholder
function _math_log10(xs) {}

// 55 custom
// replace MODG opcode (25) with math_max opcode
// change number of arguments to varargs (-1)
function _math_max(args) {
  let i = array_length(args) - 1;
  let x = -Infinity;
  while (i >= 0) {
    // x = math_max(args[i],x)
    // compile this instead for easier replacing
    x = args[i] % x;
    i = i - 1;
  }
  return x;
}

// 56 custom
// replace MODG opcode (25) with math_max opcode
// change number of arguments to varargs (-1)
function _math_min(args) {
  let i = array_length(args) - 1;
  let x = Infinity;
  while (i >= 0) {
    // x = math_min(args[i],x)
    // compile this instead for easier replacing
    x = args[i] % x;
    i = i - 1;
  }
  return x;
}

// 57 placeholder
function _math_pow(xs) {}

// 58 placeholder
function _math_random(xs) {}

// 59 placeholder
function _math_round(xs) {}

// 60 placeholder
function _math_sign(xs) {}

// 61 placeholder
function _math_sin(xs) {}

// 62 placeholder
function _math_sinh(xs) {}

// 63 placeholder
function _math_sqrt(xs) {}

// 64 placeholder
function _math_tan(xs) {}

// 65 placeholder
function _math_tanh(xs) {}

// 66 placeholder
function _math_trunc(xs) {}

// 67
function _member(v, xs) {
  return is_null(xs) ? null : v === head(xs) ? xs : member(v, tail(xs));
}

// 68
function _pair(x, y) {
  return [x, y];
}

// 69 placeholder
function _parse_int(x,y) {}

// 70
function _remove(v, xs) {
  return is_null(xs) ? null : v === head(xs) ? tail(xs) : pair(head(xs), remove(v, tail(xs)));
}

// 71
function _remove_all(v, xs) {
  return is_null(xs)
    ? null
    : v === head(xs)
    ? remove_all(v, tail(xs))
    : pair(head(xs), remove_all(v, tail(xs)));
}

// 72
function _reverse(xs) {
  function rev(original, reversed) {
    return is_null(original) ? reversed : rev(tail(original), pair(head(original), reversed));
  }
  return rev(xs, null);
}

// 73 placeholder
function _get_time(x) {}

// 74
function _set_head(xs,x) {
  if (!is_pair(xs)) {
    error('set_head(xs) expects a pair as argument xs, but encountered ' + stringify(xs));
  } else {
    xs[0] = x;
  }
}

// 75
function _set_tail(xs, x) {
  if (!is_pair(xs)) {
    error('set_tail(xs) expects a pair as argument xs, but encountered ' + stringify(xs));
  } else {
    xs[1] = x;
  }
}

// 76 custom
// change number of arguments to varargs (-1)
function _stream(args) {
  let i = array_length(args) - 1;
  let p = null;
  while (i >= 0) {
    p = pair(args[i], p);
    i = i - 1;
  }
  return list_to_stream(p);
}

// 77
function _stream_append(xs, ys) {
  return is_null(xs)
    ? ys
    : pair(head(xs),
      () => stream_append(stream_tail(xs), ys));
}

// 78
function _stream_filter(p, s) {
  return is_null(s)
    ? null
    : p(head(s))
      ? pair(head(s),
        () => stream_filter(p, stream_tail(s)))
      : stream_filter(p, stream_tail(s));
}

// 79
function _stream_for_each(fun, xs) {
    if (is_null(xs)) {
      return true;
    } else {
      fun(head(xs));
      return stream_for_each(fun, stream_tail(xs));
    }
}

// 80
function _stream_length(xs) {
  return is_null(xs)
    ? 0
    : 1 + stream_length(stream_tail(xs));
}

// 81
function _stream_map(f, s) {
  return is_null(s)
    ? null
    : pair(f(head(s)),
      () => stream_map(f, stream_tail(s)));
}

// 82
function _stream_member(x, s) {
  return is_null(s)
    ? null
    : head(s) === x
      ? s
      : stream_member(x, stream_tail(s));
}

// 83
function _stream_ref(s, n) {
  return n === 0
    ? head(s)
    : stream_ref(stream_tail(s), n - 1);
}

// 84
function _stream_remove(v, xs) {
  return is_null(xs)
    ? null
    : v === head(xs)
      ? stream_tail(xs)
      : pair(head(xs),
        () => stream_remove(v, stream_tail(xs)));
}

// 85
function _stream_remove_all(v, xs) {
  return is_null(xs)
    ? null
    : v === head(xs)
      ? stream_remove_all(v, stream_tail(xs))
      : pair(head(xs), () => stream_remove_all(v, stream_tail(xs)));
}

// 86
function _stream_reverse(xs) {
  function rev(original, reversed) {
    return is_null(original)
      ? reversed
      : rev(stream_tail(original),
        pair(head(original), () => reversed));
  }
  return rev(xs, null);
}

// 87
function _stream_tail(xs) {
  if (!is_pair(xs)) {
    error('stream_tail(xs) expects a pair as argument xs, but encountered ' + stringify(xs));
  } else if (!is_function(xs[1])) {
    error('stream_tail(xs) expects a function as the tail of the argument pair xs, ' +
      'but encountered ' + stringify(xs[1]));
  } else {
    return xs[1]();
  }
}

// 88
function _stream_to_list(xs) {
  return is_null(xs)
    ? null
    : pair(head(xs), stream_to_list(stream_tail(xs)));
}

// 89
function _tail(xs) {
  if (!is_pair(xs)) {
    error('tail(xs) expects a pair as argument xs, but encountered ' + stringify(xs));
  } else {
    return xs[1];
  }
}

// 90 placeholder
function _stringify(x) {}

// 91 custom
// change number of args to varargs
// replace NOTG opcode with PROMPT opcode
function _prompt(args) {
  if (array_length(args) === 0) {
    const p = '';
    return !p;
  } else {
    return !args[0];
  }
}

// 92 custom
// replace MODG opcode (25) with display_list opcode
// change number of arguments to varargs (-1)
function _display_list(args) {
  // display_list(args[0], args[1]);
  // compile this instead for easier replacing
  return args[0] % args[1];
}

// 93 placeholder
function _char_at(str,index) {}

// 94 placeholder
function _arity(f) {}

// hack to make the call to Program easier, just replace the index 95 (number of primitive functions + 2)
(() => 0)();
`;
// list of all primitive functions in alphabetical order. This determines the index
// of the function in the program array.
// If adding support for primitive functions, need to modify this array and the prelude
// above.
exports.PRIMITIVE_FUNCTION_NAMES = [
    'accumulate',
    'append',
    'array_length',
    'build_list',
    'build_stream',
    'display',
    'draw_data',
    'enum_list',
    'enum_stream',
    'equal',
    'error',
    'eval_stream',
    'filter',
    'for_each',
    'head',
    'integers_from',
    'is_array',
    'is_boolean',
    'is_function',
    'is_list',
    'is_null',
    'is_number',
    'is_pair',
    'is_stream',
    'is_string',
    'is_undefined',
    'length',
    'list',
    'list_ref',
    'list_to_stream',
    'list_to_string',
    'map',
    'math_abs',
    'math_acos',
    'math_acosh',
    'math_asin',
    'math_asinh',
    'math_atan',
    'math_atan2',
    'math_atanh',
    'math_cbrt',
    'math_ceil',
    'math_clz32',
    'math_cos',
    'math_cosh',
    'math_exp',
    'math_expm1',
    'math_floor',
    'math_fround',
    'math_hypot',
    'math_imul',
    'math_log',
    'math_log1p',
    'math_log2',
    'math_log10',
    'math_max',
    'math_min',
    'math_pow',
    'math_random',
    'math_round',
    'math_sign',
    'math_sin',
    'math_sinh',
    'math_sqrt',
    'math_tan',
    'math_tanh',
    'math_trunc',
    'member',
    'pair',
    'parse_int',
    'remove',
    'remove_all',
    'reverse',
    'get_time',
    'set_head',
    'set_tail',
    'stream',
    'stream_append',
    'stream_filter',
    'stream_for_each',
    'stream_length',
    'stream_map',
    'stream_member',
    'stream_ref',
    'stream_remove',
    'stream_remove_all',
    'stream_reverse',
    'stream_tail',
    'stream_to_list',
    'tail',
    'stringify',
    'prompt',
    'display_list',
    'char_at',
    'arity'
];
exports.VARARGS_NUM_ARGS = -1;
// name, opcode, number of arguments, has return value
exports.INTERNAL_FUNCTIONS = [
    ['test_and_set', opcodes_1.default.TEST_AND_SET, 1, true],
    ['clear', opcodes_1.default.CLEAR, 1, false],
    ['concurrent_execute', opcodes_1.default.EXECUTE, exports.VARARGS_NUM_ARGS, false]
];
// for each function, replace a specified opcode with another opcode
const VARARG_PRIMITIVES = [
    ['display', opcodes_1.default.MODG, opcodes_1.default.DISPLAY],
    ['error', opcodes_1.default.MODG, opcodes_1.default.ERROR],
    ['math_max', opcodes_1.default.MODG, opcodes_1.default.MATH_MAX],
    ['math_min', opcodes_1.default.MODG, opcodes_1.default.MATH_MIN],
    ['math_hypot', opcodes_1.default.NOTG, opcodes_1.default.MATH_HYPOT],
    ['list'],
    ['draw_data', opcodes_1.default.NOTG, opcodes_1.default.DRAW_DATA],
    ['stream'],
    ['prompt', opcodes_1.default.NOTG, opcodes_1.default.PROMPT],
    ['display_list', opcodes_1.default.MODG, opcodes_1.default.DISPLAY_LIST]
];
// primitives without a function should be manually implemented
exports.NULLARY_PRIMITIVES = [
    ['math_random', opcodes_1.default.MATH_RANDOM, Math.random],
    ['get_time', opcodes_1.default.RUNTIME, misc_1.get_time]
];
exports.UNARY_PRIMITIVES = [
    ['array_length', opcodes_1.default.ARRAY_LEN],
    ['is_array', opcodes_1.default.IS_ARRAY],
    ['is_boolean', opcodes_1.default.IS_BOOL],
    ['is_function', opcodes_1.default.IS_FUNC],
    ['is_null', opcodes_1.default.IS_NULL],
    ['is_number', opcodes_1.default.IS_NUMBER],
    ['is_string', opcodes_1.default.IS_STRING],
    ['is_undefined', opcodes_1.default.IS_UNDEFINED],
    ['math_abs', opcodes_1.default.MATH_ABS, Math.abs],
    ['math_acos', opcodes_1.default.MATH_ACOS, Math.acos],
    ['math_acosh', opcodes_1.default.MATH_ACOSH, Math.acosh],
    ['math_asin', opcodes_1.default.MATH_ASIN, Math.asin],
    ['math_asinh', opcodes_1.default.MATH_ASINH, Math.asinh],
    ['math_atan', opcodes_1.default.MATH_ATAN, Math.atan],
    ['math_atanh', opcodes_1.default.MATH_ATANH, Math.atanh],
    ['math_cbrt', opcodes_1.default.MATH_CBRT, Math.cbrt],
    ['math_ceil', opcodes_1.default.MATH_CEIL, Math.ceil],
    ['math_clz32', opcodes_1.default.MATH_CLZ32, Math.clz32],
    ['math_cos', opcodes_1.default.MATH_COS, Math.cos],
    ['math_cosh', opcodes_1.default.MATH_COSH, Math.cosh],
    ['math_exp', opcodes_1.default.MATH_EXP, Math.exp],
    ['math_expm1', opcodes_1.default.MATH_EXPM1, Math.expm1],
    ['math_floor', opcodes_1.default.MATH_FLOOR, Math.floor],
    ['math_fround', opcodes_1.default.MATH_FROUND, Math.fround],
    ['math_log', opcodes_1.default.MATH_LOG, Math.log],
    ['math_log1p', opcodes_1.default.MATH_LOG1P, Math.log1p],
    ['math_log2', opcodes_1.default.MATH_LOG2, Math.log2],
    ['math_log10', opcodes_1.default.MATH_LOG10, Math.log10],
    ['math_round', opcodes_1.default.MATH_ROUND, Math.round],
    ['math_sign', opcodes_1.default.MATH_SIGN, Math.sign],
    ['math_sin', opcodes_1.default.MATH_SIN, Math.sin],
    ['math_sinh', opcodes_1.default.MATH_SINH, Math.sinh],
    ['math_sqrt', opcodes_1.default.MATH_SQRT, Math.sqrt],
    ['math_tan', opcodes_1.default.MATH_TAN, Math.tan],
    ['math_tanh', opcodes_1.default.MATH_TANH, Math.tanh],
    ['math_trunc', opcodes_1.default.MATH_TRUNC, Math.trunc],
    ['stringify', opcodes_1.default.STRINGIFY],
    ['arity', opcodes_1.default.ARITY]
];
exports.BINARY_PRIMITIVES = [
    ['math_atan2', opcodes_1.default.MATH_ATAN2, Math.atan2],
    ['math_imul', opcodes_1.default.MATH_IMUL, Math.imul],
    ['math_pow', opcodes_1.default.MATH_POW, Math.pow],
    ['parse_int', opcodes_1.default.PARSE_INT, misc_1.parse_int],
    ['char_at', opcodes_1.default.CHAR_AT, misc_1.char_at]
];
exports.EXTERNAL_PRIMITIVES = [
    ['display', opcodes_1.default.DISPLAY],
    ['draw_data', opcodes_1.default.DRAW_DATA],
    ['error', opcodes_1.default.ERROR],
    ['prompt', opcodes_1.default.PROMPT],
    ['display_list', opcodes_1.default.DISPLAY_LIST]
];
exports.CONSTANT_PRIMITIVES = [
    ['undefined', undefined],
    ['Infinity', Infinity],
    ['NaN', NaN],
    ['math_E', Math.E],
    ['math_LN2', Math.LN2],
    ['math_LN10', Math.LN10],
    ['math_LOG2E', Math.LOG2E],
    ['math_LOG10E', Math.LOG10E],
    ['math_PI', Math.PI],
    ['math_SQRT1_2', Math.SQRT1_2],
    ['math_SQRT2', Math.SQRT2]
];
// helper functions to generate machine code
function generateNullaryPrimitive(index, opcode) {
    return [index, [1, 0, 0, [[opcode], [opcodes_1.default.RETG]]]];
}
function generateUnaryPrimitive(index, opcode) {
    return [index, [1, 1, 1, [[opcodes_1.default.LDLG, 0], [opcode], [opcodes_1.default.RETG]]]];
}
function generateBinaryPrimitive(index, opcode) {
    return [index, [2, 2, 2, [[opcodes_1.default.LDLG, 0], [opcodes_1.default.LDLG, 1], [opcode], [opcodes_1.default.RETG]]]];
}
// replaces prelude SVMFunction array with generated instructions
function generatePrimitiveFunctionCode(prelude) {
    const preludeFunctions = prelude[1];
    const functions = [];
    const nameToIndexMap = new Map();
    function convertPrimitiveVarArgs() {
        VARARG_PRIMITIVES.forEach(f => {
            const index = nameToIndexMap.get(f[0]);
            const opcodeToReplace = f[1];
            const opcodeToUse = f[2];
            // replace function's numargs to VARARGS_NUM_ARGS as indicator
            preludeFunctions[index + 1][2] = exports.VARARGS_NUM_ARGS;
            // replace opcode with corresponding opcode
            if (opcodeToReplace !== undefined && opcodeToUse !== undefined) {
                const instructions = preludeFunctions[index + 1][3];
                instructions.forEach(ins => {
                    if (ins[0] === opcodeToReplace)
                        ins[0] = opcodeToUse;
                });
            }
        });
    }
    exports.PRIMITIVE_FUNCTION_NAMES.forEach((name, index) => {
        nameToIndexMap.set(name, index);
    });
    exports.NULLARY_PRIMITIVES.forEach(f => functions.push(generateNullaryPrimitive(nameToIndexMap.get(f[0]), f[1])));
    exports.UNARY_PRIMITIVES.forEach(f => functions.push(generateUnaryPrimitive(nameToIndexMap.get(f[0]), f[1])));
    exports.BINARY_PRIMITIVES.forEach(f => functions.push(generateBinaryPrimitive(nameToIndexMap.get(f[0]), f[1])));
    functions.forEach(func => {
        const newFunc = func[1];
        const indexToReplace = func[0] + 1; // + 1 due to global env
        preludeFunctions[indexToReplace] = newFunc;
    });
    convertPrimitiveVarArgs();
}
exports.generatePrimitiveFunctionCode = generatePrimitiveFunctionCode;
//# sourceMappingURL=vm.prelude.js.map