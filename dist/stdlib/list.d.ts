import { Value } from '../types';
export declare type Pair<H, T> = [H, T];
export declare type List = null | NonEmptyList;
declare type NonEmptyList = Pair<any, any>;
export declare function pair<H, T>(x: H, xs: T): Pair<H, T>;
export declare function is_pair(x: any): x is Pair<any, any>;
export declare function head(xs: any): any;
export declare function tail(xs: any): any;
export declare function is_null(xs: List): xs is null;
export declare function list(...elements: any[]): List;
export declare function is_list(xs: List): xs is List;
export declare function list_to_vector(lst: List): any[];
export declare function vector_to_list(vector: any[]): List;
export declare function set_head(xs: any, x: any): undefined;
export declare function set_tail(xs: any, x: any): undefined;
/**
 * Accumulate applies given operation op to elements of a list
 * in a right-to-left order, first apply op to the last element
 * and an initial element, resulting in r1, then to the second-last
 * element and r1, resulting in r2, etc, and finally to the first element
 * and r_n-1, where n is the length of the list. `accumulate(op,zero,list(1,2,3))`
 * results in `op(1, op(2, op(3, zero)))`
 */
export declare function accumulate<T, U>(op: (each: T, result: U) => U, initial: U, sequence: List): U;
export declare function length(xs: List): number;
export declare function rawDisplayList(display: any, xs: Value, prepend: string): any;
export {};
