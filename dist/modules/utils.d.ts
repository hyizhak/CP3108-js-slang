/**
 * For tabs that are export default declarations, we need to remove
 * the `export default` bit from the front before they can be loaded
 * by js-slang
 */
export declare function evalRawTab(text: string): any;
