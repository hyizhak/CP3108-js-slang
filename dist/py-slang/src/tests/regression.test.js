"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("./utils");
describe('Regression tests for py-slang', () => {
    test('Issue #2', () => {
        const text = `
def foo():
    pass

    pass
`;
        (0, utils_1.toEstreeAST)(text);
    });
    test('Issue #5', () => {
        const text = `
print("hi")
        
print("world")
`;
        (0, utils_1.toEstreeAST)(text);
    });
    test('Issue #3', () => {
        const text = `
def foo(
    a,
    b
):
    pass

    pass
`;
        (0, utils_1.toEstreeAST)(text);
    });
    test('Issue #9', () => {
        const text = `
add_one = lambda : None
add_one = lambda : True
add_one = lambda : False
`;
        (0, utils_1.toEstreeAST)(text);
    });
});
//# sourceMappingURL=regression.test.js.map