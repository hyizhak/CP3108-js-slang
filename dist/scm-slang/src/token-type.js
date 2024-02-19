"use strict";
// Adapted from https://craftinginterpreters.com/scanning.html
// Adapted for Scheme use
Object.defineProperty(exports, "__esModule", { value: true });
exports.TokenType = void 0;
var TokenType;
(function (TokenType) {
    // + - * / % ^ ! = < > & | ~ etc are recognized as IDENTIFIERS
    // Single-character tokens
    TokenType[TokenType["LEFT_PAREN"] = 0] = "LEFT_PAREN";
    TokenType[TokenType["RIGHT_PAREN"] = 1] = "RIGHT_PAREN";
    TokenType[TokenType["LEFT_BRACKET"] = 2] = "LEFT_BRACKET";
    TokenType[TokenType["RIGHT_BRACKET"] = 3] = "RIGHT_BRACKET";
    TokenType[TokenType["APOSTROPHE"] = 4] = "APOSTROPHE";
    TokenType[TokenType["BACKTICK"] = 5] = "BACKTICK";
    TokenType[TokenType["COMMA"] = 6] = "COMMA";
    TokenType[TokenType["HASH"] = 7] = "HASH";
    TokenType[TokenType["DOT"] = 8] = "DOT";
    // Two-character tokens
    TokenType[TokenType["COMMA_AT"] = 9] = "COMMA_AT";
    // Atoms: Literals or Identifiers
    TokenType[TokenType["IDENTIFIER"] = 10] = "IDENTIFIER";
    TokenType[TokenType["NUMBER"] = 11] = "NUMBER";
    TokenType[TokenType["BOOLEAN"] = 12] = "BOOLEAN";
    TokenType[TokenType["STRING"] = 13] = "STRING";
    // SICP Chapter 1
    TokenType[TokenType["IF"] = 14] = "IF";
    TokenType[TokenType["LET"] = 15] = "LET";
    TokenType[TokenType["COND"] = 16] = "COND";
    TokenType[TokenType["ELSE"] = 17] = "ELSE";
    TokenType[TokenType["DEFINE"] = 18] = "DEFINE";
    TokenType[TokenType["LAMBDA"] = 19] = "LAMBDA";
    // SICP Chapter 2
    TokenType[TokenType["QUOTE"] = 20] = "QUOTE";
    TokenType[TokenType["UNQUOTE"] = 21] = "UNQUOTE";
    TokenType[TokenType["QUASIQUOTE"] = 22] = "QUASIQUOTE";
    // SICP Chapter 3
    TokenType[TokenType["SET"] = 23] = "SET";
    TokenType[TokenType["BEGIN"] = 24] = "BEGIN";
    TokenType[TokenType["DELAY"] = 25] = "DELAY";
    // Other important keywords
    TokenType[TokenType["IMPORT"] = 26] = "IMPORT";
    TokenType[TokenType["EXPORT"] = 27] = "EXPORT";
    // Not in scope at the moment
    TokenType[TokenType["VECTOR"] = 28] = "VECTOR";
    TokenType[TokenType["UNQUOTE_SPLICING"] = 29] = "UNQUOTE_SPLICING";
    TokenType[TokenType["EOF"] = 30] = "EOF";
})(TokenType = exports.TokenType || (exports.TokenType = {}));
//# sourceMappingURL=token-type.js.map