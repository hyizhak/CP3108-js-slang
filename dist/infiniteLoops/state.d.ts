import * as es from 'estree';
import * as sym from './symbolic';
declare type Path = number[];
export declare type Transition = {
    name: string;
    value: any;
    cachedSymbolicValue: number;
};
declare type FunctionStackFrame = {
    name: string;
    transitions: Transition[];
};
declare type Iteration = {
    loc: string;
    paths: Path;
    transitions: Transition[];
};
declare type IterationsTracker = number[];
export declare class State {
    variablesModified: Map<string, sym.Hybrid>;
    variablesToReset: Set<string>;
    stringToIdCache: Map<string, number>;
    idToStringCache: string[];
    idToExprCache: es.Expression[];
    mixedStack: Iteration[];
    stackPointer: number;
    loopStack: IterationsTracker[];
    functionTrackers: Map<string, IterationsTracker>;
    functionStack: FunctionStackFrame[];
    threshold: number;
    streamThreshold: number;
    startTime: number;
    timeout: number;
    streamMode: boolean;
    streamLastFunction: string | undefined;
    streamCounts: Map<string, number>;
    lastLocation: es.SourceLocation | undefined;
    functionWasPassedAsArgument: boolean;
    constructor(timeout?: number, threshold?: number, streamThreshold?: number);
    static isInvalidPath(path: Path): boolean;
    static isNonDetTransition(transition: Transition[]): boolean;
    static isInvalidTransition(transition: Transition[]): boolean;
    /**
     * Takes in an expression and returns its cached representation.
     */
    toCached(expr: es.Expression): number;
    popStackToStackPointer(): void;
    exitLoop(): void;
    savePath(expr: es.Expression): void;
    /**
     * Sets the current path as invalid.
     */
    setInvalidPath(): void;
    saveTransition(name: string, value: sym.Hybrid): void;
    /**
     * Creates a new stack frame.
     * @returns pointer to the new stack frame.
     */
    newStackFrame(loc: string): number;
    /**
     * Saves variables that were modified to the current transition.
     * Also adds the variable to this.variablesToReset. These variables
     * will be lazily reset (concretized and re-hybridized) in runtime.hybridize.
     */
    cleanUpVariables(): void;
    /**
     * Records entering a function in the state.
     * @param name name of the function.
     * @returns [tracker, firstIteration] where firstIteration is true if this is the functions first iteration.
     */
    enterFunction(name: string): [IterationsTracker, boolean];
    /**
     * Saves args into the last iteration's transition in the tracker.
     */
    saveArgsInTransition(args: any[], tracker: IterationsTracker): void;
    /**
     * Records in the state that the last function has returned.
     */
    returnLastFunction(): void;
    hasTimedOut(): boolean;
    /**
     * @returns the name of the last function in the stack.
     */
    getLastFunctionName(): any;
}
export {};
