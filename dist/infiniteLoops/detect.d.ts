import * as st from './state';
/**
 * Checks if the program is stuck in an infinite loop.
 * @throws InfiniteLoopError if so.
 * @returns void otherwise.
 */
export declare function checkForInfiniteLoop(stackPositions: number[], state: st.State, functionName: string | undefined): void;
