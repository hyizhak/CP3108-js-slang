import * as es from 'estree';
import { ErrorSeverity, ErrorType, Rule, SourceError } from '../../../types';
export declare class NoSpreadInArray implements SourceError {
    node: es.SpreadElement;
    type: ErrorType;
    severity: ErrorSeverity;
    constructor(node: es.SpreadElement);
    get location(): es.SourceLocation;
    explain(): string;
    elaborate(): string;
}
declare const noSpreadInArray: Rule<es.SpreadElement>;
export default noSpreadInArray;
