"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.areBreakpointsSet = exports.checkEditorBreakpoints = exports.manualToggleDebugger = exports.setBreakpointAtLine = exports.saveState = void 0;
const saveState = (context, it, scheduler) => {
    context.debugger.state.it = it;
    context.debugger.state.scheduler = scheduler;
};
exports.saveState = saveState;
const setBreakpointAtLine = (lines) => {
    breakpoints = lines;
};
exports.setBreakpointAtLine = setBreakpointAtLine;
const manualToggleDebugger = (context) => {
    context.runtime.break = true;
    return {
        status: 'suspended',
        scheduler: context.debugger.state.scheduler,
        it: context.debugger.state.it,
        context
    };
};
exports.manualToggleDebugger = manualToggleDebugger;
let breakpoints = [];
let moved = true;
let prevStoppedLine = -1;
const checkEditorBreakpoints = (context, node) => {
    if (node.loc) {
        const currentLine = node.loc.start.line - 1;
        if (!moved && currentLine !== prevStoppedLine) {
            moved = true;
        }
        if (context.runtime.debuggerOn && breakpoints[currentLine] !== undefined && moved) {
            moved = false;
            prevStoppedLine = currentLine;
            context.runtime.break = true;
        }
    }
};
exports.checkEditorBreakpoints = checkEditorBreakpoints;
const areBreakpointsSet = () => breakpoints.length > 0;
exports.areBreakpointsSet = areBreakpointsSet;
//# sourceMappingURL=inspector.js.map