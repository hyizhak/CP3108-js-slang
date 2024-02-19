import * as es from 'estree';
import { ErrorSeverity, ErrorType, Rule, SourceError } from '../../../types';
export declare class NoTemplateExpressionError implements SourceError {
    node: es.TemplateLiteral;
    type: ErrorType;
    severity: ErrorSeverity;
    constructor(node: es.TemplateLiteral);
    get location(): es.SourceLocation;
    explain(): string;
    elaborate(): string;
}
declare const noTemplateExpression: Rule<es.TemplateLiteral>;
export default noTemplateExpression;
