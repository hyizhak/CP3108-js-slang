"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NoImportSpecifierWithDefaultError = void 0;
const constants_1 = require("../../../constants");
const localImport_prelude_1 = require("../../../stdlib/localImport.prelude");
const types_1 = require("../../../types");
const syntax_1 = require("../syntax");
class NoImportSpecifierWithDefaultError {
    constructor(node) {
        this.node = node;
        this.type = types_1.ErrorType.SYNTAX;
        this.severity = types_1.ErrorSeverity.ERROR;
    }
    get location() {
        var _a;
        return (_a = this.node.loc) !== null && _a !== void 0 ? _a : constants_1.UNKNOWN_LOCATION;
    }
    explain() {
        return 'Import default specifiers are not allowed';
    }
    elaborate() {
        return 'You are trying to use an import default specifier, which is not allowed (yet).';
    }
}
exports.NoImportSpecifierWithDefaultError = NoImportSpecifierWithDefaultError;
const noImportSpecifierWithDefault = {
    name: 'no-declare-mutable',
    disableFromChapter: syntax_1.default['ImportDefaultSpecifier'],
    checkers: {
        ImportSpecifier(node, _ancestors) {
            if (node.imported.name === localImport_prelude_1.defaultExportLookupName) {
                return [new NoImportSpecifierWithDefaultError(node)];
            }
            return [];
        }
    }
};
exports.default = noImportSpecifierWithDefault;
//# sourceMappingURL=noImportSpecifierWithDefault.js.map