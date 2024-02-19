"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.stream = exports.misc = exports.list = exports.chapter_library_parser = exports.chapter_4 = exports.chapter_3 = exports.chapter_2 = exports.chapter_1 = void 0;
const createContext_1 = require("../createContext");
const types_1 = require("../types");
const list = require("./list");
const misc = require("./misc");
const parser = require("./parser");
const stream = require("./stream");
exports.chapter_1 = {
    get_time: misc.error_message,
    error_message: misc.error_message,
    is_number: misc.is_number,
    is_string: misc.is_string,
    is_function: misc.is_function,
    is_boolean: misc.is_boolean,
    is_undefined: misc.is_undefined,
    parse_int: misc.parse_int,
    char_at: misc.char_at,
    arity: misc.arity,
    undefined: undefined,
    NaN: NaN,
    Infinity: Infinity
};
exports.chapter_2 = Object.assign(Object.assign({}, exports.chapter_1), { pair: list.pair, is_pair: list.is_pair, head: list.head, tail: list.tail, is_null: list.is_null, list: list.list, 
    // defineBuiltin(context, 'draw_data(...xs)', visualiseList, 1)
    // defineBuiltin(context, 'display_list(val, prepend = undefined)', displayList, 0)
    is_list: list.is_list });
exports.chapter_3 = Object.assign(Object.assign({}, exports.chapter_2), { set_head: list.set_head, set_tail: list.set_tail, array_length: misc.array_length, is_array: misc.is_array, 
    // Stream library
    stream_tail: stream.stream_tail, stream: stream.stream });
exports.chapter_4 = Object.assign(Object.assign({}, exports.chapter_3), { parse: (str, chapter) => parser.parse(str, (0, createContext_1.default)(chapter)), tokenize: (str, chapter) => parser.tokenize(str, (0, createContext_1.default)(chapter)), 
    // tslint:disable-next-line:ban-types
    apply_in_underlying_javascript: (fun, args) => fun.apply(fun, list.list_to_vector(args)) });
exports.chapter_library_parser = Object.assign(Object.assign({}, exports.chapter_4), { is_object: misc.is_object, is_NaN: misc.is_NaN, has_own_property: misc.has_own_property });
exports.default = {
    [types_1.Chapter.SOURCE_1]: exports.chapter_1,
    [types_1.Chapter.SOURCE_2]: exports.chapter_2,
    [types_1.Chapter.SOURCE_3]: exports.chapter_3,
    [types_1.Chapter.SOURCE_4]: exports.chapter_4,
    [types_1.Chapter.LIBRARY_PARSER]: exports.chapter_library_parser
};
exports.list = require("./list");
exports.misc = require("./misc");
exports.stream = require("./stream");
//# sourceMappingURL=index.js.map