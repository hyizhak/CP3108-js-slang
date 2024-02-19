import * as es from 'estree';
declare class GPULoopVerifier {
    node: es.ForStatement;
    counter: string;
    end: es.Expression;
    ok: boolean;
    constructor(node: es.ForStatement);
    forLoopTransform: (node: es.ForStatement) => void;
    hasCounter: (node: es.VariableDeclaration | es.Expression | null) => boolean;
    hasCondition: (node: es.Expression) => boolean;
    hasUpdate: (node: es.Expression) => boolean;
}
export default GPULoopVerifier;
