"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const types_1 = require("../../../types");
const noUnspecifiedOperator_1 = require("./noUnspecifiedOperator");
const noTypeofOperator = {
    name: 'no-typeof-operator',
    disableForVariants: [types_1.Variant.TYPED],
    checkers: {
        UnaryExpression(node) {
            if (node.operator === 'typeof') {
                return [new noUnspecifiedOperator_1.NoUnspecifiedOperatorError(node)];
            }
            else {
                return [];
            }
        }
    }
};
exports.default = noTypeofOperator;
//# sourceMappingURL=noTypeofOperator.js.map