import * as es from 'estree';
import { ErrorSeverity, ErrorType, Rule, SourceError } from '../../../types';
export declare class NoImplicitReturnUndefinedError implements SourceError {
    node: es.ReturnStatement;
    type: ErrorType;
    severity: ErrorSeverity;
    constructor(node: es.ReturnStatement);
    get location(): es.SourceLocation;
    explain(): string;
    elaborate(): string;
}
declare const noImplicitReturnUndefined: Rule<es.ReturnStatement>;
export default noImplicitReturnUndefined;
