"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.htmlRunner = exports.htmlErrorHandlingScript = void 0;
const HTML_ERROR_HANDLING_SCRIPT_TEMPLATE = `<script>
  window.onerror = (msg, url, lineNum) => {
    window.parent.postMessage("Line " + Math.max(lineNum - %d, 0) + ": " + msg, "*");
  };
</script>\n`;
const errorScriptLines = HTML_ERROR_HANDLING_SCRIPT_TEMPLATE.split('\n').length - 1;
exports.htmlErrorHandlingScript = HTML_ERROR_HANDLING_SCRIPT_TEMPLATE.replace('%d', errorScriptLines.toString());
function htmlRunner(code, context, options = {}) {
    return __awaiter(this, void 0, void 0, function* () {
        return Promise.resolve({
            status: 'finished',
            context,
            value: exports.htmlErrorHandlingScript + code
        });
    });
}
exports.htmlRunner = htmlRunner;
//# sourceMappingURL=htmlRunner.js.map