"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CircularImportError = exports.CannotFindModuleError = exports.ConsecutiveSlashesInFilePathError = exports.IllegalCharInFilePathError = exports.InvalidFilePathError = void 0;
const constants_1 = require("../constants");
const filePaths_1 = require("../localImports/filePaths");
const types_1 = require("../types");
class InvalidFilePathError {
    constructor(filePath) {
        this.filePath = filePath;
        this.type = types_1.ErrorType.TYPE;
        this.severity = types_1.ErrorSeverity.ERROR;
        this.location = constants_1.UNKNOWN_LOCATION;
    }
}
exports.InvalidFilePathError = InvalidFilePathError;
class IllegalCharInFilePathError extends InvalidFilePathError {
    explain() {
        const validNonAlphanumericChars = Object.keys(filePaths_1.nonAlphanumericCharEncoding)
            .map(char => `'${char}'`)
            .join(', ');
        return `File path '${this.filePath}' must only contain alphanumeric chars and/or ${validNonAlphanumericChars}.`;
    }
    elaborate() {
        return 'Rename the offending file path to only use valid chars.';
    }
}
exports.IllegalCharInFilePathError = IllegalCharInFilePathError;
class ConsecutiveSlashesInFilePathError extends InvalidFilePathError {
    explain() {
        return `File path '${this.filePath}' cannot contain consecutive slashes '//'.`;
    }
    elaborate() {
        return 'Remove consecutive slashes from the offending file path.';
    }
}
exports.ConsecutiveSlashesInFilePathError = ConsecutiveSlashesInFilePathError;
class CannotFindModuleError {
    constructor(moduleFilePath) {
        this.moduleFilePath = moduleFilePath;
        this.type = types_1.ErrorType.TYPE;
        this.severity = types_1.ErrorSeverity.ERROR;
        this.location = constants_1.UNKNOWN_LOCATION;
    }
    explain() {
        return `Cannot find module '${this.moduleFilePath}'.`;
    }
    elaborate() {
        return 'Check that the module file path resolves to an existing file.';
    }
}
exports.CannotFindModuleError = CannotFindModuleError;
class CircularImportError {
    constructor(filePathsInCycle) {
        this.filePathsInCycle = filePathsInCycle;
        this.type = types_1.ErrorType.TYPE;
        this.severity = types_1.ErrorSeverity.ERROR;
        this.location = constants_1.UNKNOWN_LOCATION;
    }
    explain() {
        // We need to reverse the file paths in the cycle so that the
        // semantics of "'/a.js' -> '/b.js'" is "'/a.js' imports '/b.js'".
        const formattedCycle = this.filePathsInCycle
            .map(filePath => `'${filePath}'`)
            .reverse()
            .join(' -> ');
        return `Circular import detected: ${formattedCycle}.`;
    }
    elaborate() {
        return 'Break the circular import cycle by removing imports from any of the offending files.';
    }
}
exports.CircularImportError = CircularImportError;
//# sourceMappingURL=localImportErrors.js.map