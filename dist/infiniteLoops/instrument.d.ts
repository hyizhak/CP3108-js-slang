import * as es from 'estree';
declare const globalIds: {
    builtinsId: string;
    functionsId: string;
    stateId: string;
};
declare enum FunctionNames {
    nothingFunction = 0,
    concretize = 1,
    hybridize = 2,
    wrapArg = 3,
    dummify = 4,
    saveBool = 5,
    saveVar = 6,
    preFunction = 7,
    returnFunction = 8,
    postLoop = 9,
    enterLoop = 10,
    exitLoop = 11,
    trackLoc = 12,
    evalB = 13,
    evalU = 14
}
/**
 * Returns the original name of the variable before
 * it was changed during the code instrumentation process.
 */
export declare function getOriginalName(name: string): string;
/**
 * Instruments the given code with functions that track the state of the program.
 *
 * @param previous programs that were previously executed in the REPL, most recent first (at ix 0).
 * @param program most recent program executed.
 * @param builtins Names of builtin functions.
 * @returns code with instrumentations.
 */
declare function instrument(previous: es.Program[], program: es.Program, builtins: Iterable<string>): Promise<string>;
export { instrument, FunctionNames as InfiniteLoopRuntimeFunctions, globalIds as InfiniteLoopRuntimeObjectNames };
