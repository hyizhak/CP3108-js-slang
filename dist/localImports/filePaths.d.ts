import { InvalidFilePathError } from '../errors/localImportErrors';
/**
 * Maps non-alphanumeric characters that are legal in file paths
 * to strings which are legal in function names.
 */
export declare const nonAlphanumericCharEncoding: Record<string, string>;
/**
 * Transforms the given file path to a valid function name. The
 * characters in a valid function name must be either an
 * alphanumeric character, the underscore (_), or the dollar ($).
 *
 * In addition, the returned function name has underscores appended
 * on both ends to make it even less likely that the function name
 * will collide with a user-inputted name.
 *
 * @param filePath The file path to transform.
 */
export declare const transformFilePathToValidFunctionName: (filePath: string) => string;
/**
 * Transforms the given function name to the expected name that
 * the variable holding the result of invoking the function should
 * have. The main consideration of this transformation is that
 * the resulting name should not conflict with any of the names
 * that can be generated by `transformFilePathToValidFunctionName`.
 *
 * @param functionName The function name to transform.
 */
export declare const transformFunctionNameToInvokedFunctionResultVariableName: (functionName: string) => string;
/**
 * Validates the given file path, returning an `InvalidFilePathError`
 * if the file path is invalid & `null` otherwise. A file path is
 * valid if it only contains alphanumeric characters and the characters
 * defined in `charEncoding`, and does not contain consecutive slash
 * characters (//).
 *
 * @param filePath The file path to check.
 */
export declare const validateFilePath: (filePath: string) => InvalidFilePathError | null;
/**
 * Returns whether a string is a file path. We define a file
 * path to be any string containing the '/' character.
 *
 * @param value The value of the string.
 */
export declare const isFilePath: (value: string) => boolean;
