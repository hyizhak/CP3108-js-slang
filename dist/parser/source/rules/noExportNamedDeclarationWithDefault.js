"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NoExportNamedDeclarationWithDefaultError = void 0;
const constants_1 = require("../../../constants");
const localImport_prelude_1 = require("../../../stdlib/localImport.prelude");
const types_1 = require("../../../types");
const syntax_1 = require("../syntax");
class NoExportNamedDeclarationWithDefaultError {
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
        return 'Export default declarations are not allowed';
    }
    elaborate() {
        return 'You are trying to use an export default declaration, which is not allowed (yet).';
    }
}
exports.NoExportNamedDeclarationWithDefaultError = NoExportNamedDeclarationWithDefaultError;
const noExportNamedDeclarationWithDefault = {
    name: 'no-declare-mutable',
    disableFromChapter: syntax_1.default['ExportDefaultDeclaration'],
    checkers: {
        ExportNamedDeclaration(node, _ancestors) {
            const errors = [];
            node.specifiers.forEach((specifier) => {
                if (specifier.exported.name === localImport_prelude_1.defaultExportLookupName) {
                    errors.push(new NoExportNamedDeclarationWithDefaultError(node));
                }
            });
            return errors;
        }
    }
};
exports.default = noExportNamedDeclarationWithDefault;
//# sourceMappingURL=noExportNamedDeclarationWithDefault.js.map