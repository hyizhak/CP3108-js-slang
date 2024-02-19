import * as es from 'estree';
import { Context, substituterNodes } from '../types';
export declare function valueToExpression(value: any, context?: Context): es.Expression;
export declare function nodeToValue(node: substituterNodes): any;
export declare function nodeToValueWithContext(node: substituterNodes, context: Context): any;
export declare function objectToString(value: any): string;
