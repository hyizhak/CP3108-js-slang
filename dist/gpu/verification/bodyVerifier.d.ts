import * as es from 'estree';
declare class GPUBodyVerifier {
    program: es.Program;
    node: es.Statement;
    state: number;
    localVar: Set<string>;
    counters: string[];
    outputArray: es.Identifier;
    /**
     *
     * @param node body to be verified
     * @param counters list of for loop counters (to check array assignment)
     */
    constructor(program: es.Program, node: es.Statement, counters: string[]);
    checkBody: (node: es.Statement) => void;
    getArrayName: (node: es.MemberExpression) => es.Identifier;
    getPropertyAccess: (node: es.MemberExpression) => string[];
}
export default GPUBodyVerifier;
