"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TranslatorErrors = exports.ResolverErrors = exports.ParserErrors = exports.TokenizerErrors = void 0;
/*The offset is calculated as follows:
  Current position is one after real position of end of token: 1
*/
const MAGIC_OFFSET = 1;
const SPECIAL_CHARS = new RegExp("[\\\\$'\"]", "g");
function escape(unsafe) {
    // @TODO escape newlines
    return unsafe.replace(SPECIAL_CHARS, "\\$&");
}
/* Searches backwards and forwards till it hits a newline */
function getFullLine(source, current) {
    let back = current;
    let forward = current;
    while (back > 0 && source[back] != '\n') {
        back--;
    }
    if (source[back] === '\n') {
        back++;
    }
    while (forward < source.length && source[forward] != '\n') {
        forward++;
    }
    return '\n' + source.slice(back, forward);
}
function toEstreeLocation(line, column, offset) {
    return { line, column, offset };
}
var TokenizerErrors;
(function (TokenizerErrors) {
    class BaseTokenizerError extends SyntaxError {
        constructor(message, line, col) {
            super(`SyntaxError at line ${line} column ${col - 1}
                   ${message}`);
            this.line = line;
            this.col = col;
            this.name = "BaseTokenizerError";
            this.loc = toEstreeLocation(line, col, 0);
        }
    }
    TokenizerErrors.BaseTokenizerError = BaseTokenizerError;
    class UnknownTokenError extends BaseTokenizerError {
        constructor(token, line, col, source, current) {
            let msg = getFullLine(source, current - 1) + "\n";
            let hint = `${col > 1 ? '~' : ''}^~ Unknown token '${escape(token)}'`;
            // The extra `~` character takes up some space.
            hint = hint.padStart(hint.length + col - MAGIC_OFFSET - (col > 1 ? 1 : 0), " ");
            super(msg + hint, line, col);
            this.name = "UnknownTokenError";
        }
    }
    TokenizerErrors.UnknownTokenError = UnknownTokenError;
    class UnterminatedStringError extends BaseTokenizerError {
        constructor(line, col, source, start, current) {
            let msg = getFullLine(source, start) + "\n";
            let hint = `^ Unterminated string`;
            const diff = (current - start);
            // +1 because we want the arrow to point after the string (where we expect the closing ")
            hint = hint.padStart(hint.length + diff - MAGIC_OFFSET + 1, "~");
            hint = hint.padStart(hint.length + col - diff, " ");
            super(msg + hint, line, col);
            this.name = "UnterminatedStringError";
        }
    }
    TokenizerErrors.UnterminatedStringError = UnterminatedStringError;
    class NonFourIndentError extends BaseTokenizerError {
        constructor(line, col, source, start) {
            let msg = getFullLine(source, start) + "\n";
            let hint = `^ This indent should be a multiple of 4 spaces. It's currently ${col} spaces.`;
            hint = hint.padStart(hint.length + col - MAGIC_OFFSET, "-");
            super(msg + hint, line, col);
            this.name = "NonFourIndentError";
        }
    }
    TokenizerErrors.NonFourIndentError = NonFourIndentError;
    class InconsistentIndentError extends BaseTokenizerError {
        constructor(line, col, source, start) {
            let msg = getFullLine(source, start) + "\n";
            let hint = `^ This indent/dedent is inconsistent with other indents/dedents. It's currently ${col} spaces.`;
            hint = hint.padStart(hint.length + col - MAGIC_OFFSET, "-");
            super(msg + hint, line, col);
            this.name = "InconsistentIndentError";
        }
    }
    TokenizerErrors.InconsistentIndentError = InconsistentIndentError;
    class ForbiddenIdentifierError extends BaseTokenizerError {
        constructor(line, col, source, start) {
            let msg = getFullLine(source, start) + "\n";
            let hint = `^ This identifier is reserved for use in Python. Consider using another identifier.`;
            hint = hint.padStart(hint.length + col - MAGIC_OFFSET, "^");
            super(msg + hint, line, col);
            this.name = "ForbiddenIdentifierError";
        }
    }
    TokenizerErrors.ForbiddenIdentifierError = ForbiddenIdentifierError;
    class ForbiddenOperatorError extends BaseTokenizerError {
        constructor(line, col, source, start, current) {
            let msg = getFullLine(source, start) + "\n";
            let hint = ` This operator is reserved for use in Python. It's not allowed to be used.`;
            const diff = (current - start);
            hint = hint.padStart(hint.length + diff - MAGIC_OFFSET + 1, "^");
            hint = hint.padStart(hint.length + col - diff, " ");
            super(msg + hint, line, col);
            this.name = "ForbiddenOperatorError";
        }
    }
    TokenizerErrors.ForbiddenOperatorError = ForbiddenOperatorError;
    class NonMatchingParenthesesError extends BaseTokenizerError {
        constructor(line, col, source, current) {
            let msg = getFullLine(source, current - 1) + "\n";
            let hint = `${col > 1 ? '~' : ''}^~ Non-matching closing parentheses.`;
            // The extra `~` character takes up some space.
            hint = hint.padStart(hint.length + col - MAGIC_OFFSET - (col > 1 ? 1 : 0), " ");
            super(msg + hint, line, col);
            this.name = "NonMatchingParenthesesError";
        }
    }
    TokenizerErrors.NonMatchingParenthesesError = NonMatchingParenthesesError;
})(TokenizerErrors = exports.TokenizerErrors || (exports.TokenizerErrors = {}));
var ParserErrors;
(function (ParserErrors) {
    class BaseParserError extends SyntaxError {
        constructor(message, line, col) {
            super(`SyntaxError at line ${line} column ${col - 1}
                   ${message}`);
            this.line = line;
            this.col = col;
            this.name = "BaseParserError";
            this.loc = toEstreeLocation(line, col, 0);
        }
    }
    ParserErrors.BaseParserError = BaseParserError;
    class ExpectedTokenError extends BaseParserError {
        constructor(source, current, expected) {
            let msg = getFullLine(source, current.indexInSource - current.lexeme.length) + "\n";
            let hint = `^ ${expected}. Found '${escape(current.lexeme)}'.`;
            hint = hint.padStart(hint.length + current.col - MAGIC_OFFSET, " ");
            super(msg + hint, current.line, current.col);
            this.name = "ExpectedTokenError";
        }
    }
    ParserErrors.ExpectedTokenError = ExpectedTokenError;
    class NoElseBlockError extends BaseParserError {
        constructor(source, current) {
            let msg = getFullLine(source, current.indexInSource) + "\n";
            let hint = `^ Expected else block after this if block.`;
            hint = hint.padStart(hint.length + current.col - MAGIC_OFFSET, " ");
            super(msg + hint, current.line, current.col);
            this.name = "ExpectedTokenError";
        }
    }
    ParserErrors.NoElseBlockError = NoElseBlockError;
    class GenericUnexpectedSyntaxError extends BaseParserError {
        constructor(line, col, source, start, current) {
            let msg = getFullLine(source, start) + "\n";
            let hint = ` Detected invalid syntax.`;
            const diff = (current - start);
            hint = hint.padStart(hint.length + diff - MAGIC_OFFSET, "^");
            hint = hint.padStart(hint.length + col - diff, " ");
            super(msg + hint, line, col);
            this.name = "GenericUnexpectedSyntaxError";
        }
    }
    ParserErrors.GenericUnexpectedSyntaxError = GenericUnexpectedSyntaxError;
})(ParserErrors = exports.ParserErrors || (exports.ParserErrors = {}));
var ResolverErrors;
(function (ResolverErrors) {
    class BaseResolverError extends SyntaxError {
        constructor(message, line, col) {
            super(`ResolverError at line ${line} column ${col - 1}
                   ${message}`);
            this.line = line;
            this.col = col;
            this.name = "BaseResolverError";
            this.loc = toEstreeLocation(line, col, 0);
        }
    }
    ResolverErrors.BaseResolverError = BaseResolverError;
    class NameNotFoundError extends BaseResolverError {
        constructor(line, col, source, start, current, suggestion) {
            let msg = getFullLine(source, start) + "\n";
            let hint = ` This name is not found in the current or enclosing environment(s).`;
            const diff = (current - start);
            hint = hint.padStart(hint.length + diff - MAGIC_OFFSET + 1, "^");
            hint = hint.padStart(hint.length + col - diff, " ");
            if (suggestion !== null) {
                let sugg = ` Perhaps you meant to type '${suggestion}'?`;
                sugg = sugg.padStart(sugg.length + col - MAGIC_OFFSET + 1, " ");
                sugg = '\n' + sugg;
                hint += sugg;
            }
            super(msg + hint, line, col);
            this.name = "NameNotFoundError";
        }
    }
    ResolverErrors.NameNotFoundError = NameNotFoundError;
    class NameReassignmentError extends BaseResolverError {
        constructor(line, col, source, start, current, oldName) {
            let msg = getFullLine(source, start) + "\n";
            let hint = ` A name has been declared here.`;
            const diff = (current - start);
            hint = hint.padStart(hint.length + diff - MAGIC_OFFSET + 1, "^");
            hint = hint.padStart(hint.length + col - diff, " ");
            let sugg = ` However, it has already been declared in the same environment at line ${oldName.line}, here:`;
            sugg = sugg.padStart(sugg.length + col - MAGIC_OFFSET + 1, " ");
            sugg = '\n' + sugg;
            hint += sugg;
            let oldNameLine = getFullLine(source, oldName.indexInSource);
            oldNameLine.padStart(oldNameLine.length + col - MAGIC_OFFSET + 1, " ");
            hint += oldNameLine;
            super(msg + hint, line, col);
            this.name = "NameReassignmentError";
        }
    }
    ResolverErrors.NameReassignmentError = NameReassignmentError;
})(ResolverErrors = exports.ResolverErrors || (exports.ResolverErrors = {}));
var TranslatorErrors;
(function (TranslatorErrors) {
    class BaseTranslatorError extends SyntaxError {
        constructor(message, line, col) {
            super(`BaseTranslatorError at line ${line} column ${col - 1}
                   ${message}`);
            this.line = line;
            this.col = col;
            this.name = "BaseTranslatorError";
            this.loc = toEstreeLocation(line, col, 0);
        }
    }
    TranslatorErrors.BaseTranslatorError = BaseTranslatorError;
    class UnsupportedOperator extends BaseTranslatorError {
        constructor(line, col, source, start) {
            let msg = getFullLine(source, start) + "\n";
            let hint = `^ This operator is not yet supported by us.`;
            hint = hint.padStart(hint.length + col - MAGIC_OFFSET, " ");
            super(msg + hint, line, col);
            this.name = "UnsupportedOperator";
        }
    }
    TranslatorErrors.UnsupportedOperator = UnsupportedOperator;
})(TranslatorErrors = exports.TranslatorErrors || (exports.TranslatorErrors = {}));
//# sourceMappingURL=errors.js.map