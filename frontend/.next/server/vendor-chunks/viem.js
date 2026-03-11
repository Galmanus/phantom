"use strict";
/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
exports.id = "vendor-chunks/viem";
exports.ids = ["vendor-chunks/viem"];
exports.modules = {

/***/ "(ssr)/./node_modules/viem/_esm/utils/unit/formatUnits.js":
/*!**********************************************************!*\
  !*** ./node_modules/viem/_esm/utils/unit/formatUnits.js ***!
  \**********************************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   formatUnits: () => (/* binding */ formatUnits)\n/* harmony export */ });\n/**\n *  Divides a number by a given exponent of base 10 (10exponent), and formats it into a string representation of the number..\n *\n * - Docs: https://viem.sh/docs/utilities/formatUnits\n *\n * @example\n * import { formatUnits } from 'viem'\n *\n * formatUnits(420000000000n, 9)\n * // '420'\n */\nfunction formatUnits(value, decimals) {\n    let display = value.toString();\n    const negative = display.startsWith('-');\n    if (negative)\n        display = display.slice(1);\n    display = display.padStart(decimals, '0');\n    let [integer, fraction] = [\n        display.slice(0, display.length - decimals),\n        display.slice(display.length - decimals),\n    ];\n    fraction = fraction.replace(/(0+)$/, '');\n    return `${negative ? '-' : ''}${integer || '0'}${fraction ? `.${fraction}` : ''}`;\n}\n//# sourceMappingURL=formatUnits.js.map//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHNzcikvLi9ub2RlX21vZHVsZXMvdmllbS9fZXNtL3V0aWxzL3VuaXQvZm9ybWF0VW5pdHMuanMiLCJtYXBwaW5ncyI6Ijs7OztBQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFlBQVksY0FBYztBQUMxQjtBQUNBO0FBQ0E7QUFDQTtBQUNPO0FBQ1A7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxjQUFjLG9CQUFvQixFQUFFLGVBQWUsRUFBRSxlQUFlLFNBQVMsT0FBTztBQUNwRjtBQUNBIiwic291cmNlcyI6WyJ3ZWJwYWNrOi8vcGhhbnRvbS1mcm9udGVuZC8uL25vZGVfbW9kdWxlcy92aWVtL19lc20vdXRpbHMvdW5pdC9mb3JtYXRVbml0cy5qcz81ZTBiIl0sInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogIERpdmlkZXMgYSBudW1iZXIgYnkgYSBnaXZlbiBleHBvbmVudCBvZiBiYXNlIDEwICgxMGV4cG9uZW50KSwgYW5kIGZvcm1hdHMgaXQgaW50byBhIHN0cmluZyByZXByZXNlbnRhdGlvbiBvZiB0aGUgbnVtYmVyLi5cbiAqXG4gKiAtIERvY3M6IGh0dHBzOi8vdmllbS5zaC9kb2NzL3V0aWxpdGllcy9mb3JtYXRVbml0c1xuICpcbiAqIEBleGFtcGxlXG4gKiBpbXBvcnQgeyBmb3JtYXRVbml0cyB9IGZyb20gJ3ZpZW0nXG4gKlxuICogZm9ybWF0VW5pdHMoNDIwMDAwMDAwMDAwbiwgOSlcbiAqIC8vICc0MjAnXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBmb3JtYXRVbml0cyh2YWx1ZSwgZGVjaW1hbHMpIHtcbiAgICBsZXQgZGlzcGxheSA9IHZhbHVlLnRvU3RyaW5nKCk7XG4gICAgY29uc3QgbmVnYXRpdmUgPSBkaXNwbGF5LnN0YXJ0c1dpdGgoJy0nKTtcbiAgICBpZiAobmVnYXRpdmUpXG4gICAgICAgIGRpc3BsYXkgPSBkaXNwbGF5LnNsaWNlKDEpO1xuICAgIGRpc3BsYXkgPSBkaXNwbGF5LnBhZFN0YXJ0KGRlY2ltYWxzLCAnMCcpO1xuICAgIGxldCBbaW50ZWdlciwgZnJhY3Rpb25dID0gW1xuICAgICAgICBkaXNwbGF5LnNsaWNlKDAsIGRpc3BsYXkubGVuZ3RoIC0gZGVjaW1hbHMpLFxuICAgICAgICBkaXNwbGF5LnNsaWNlKGRpc3BsYXkubGVuZ3RoIC0gZGVjaW1hbHMpLFxuICAgIF07XG4gICAgZnJhY3Rpb24gPSBmcmFjdGlvbi5yZXBsYWNlKC8oMCspJC8sICcnKTtcbiAgICByZXR1cm4gYCR7bmVnYXRpdmUgPyAnLScgOiAnJ30ke2ludGVnZXIgfHwgJzAnfSR7ZnJhY3Rpb24gPyBgLiR7ZnJhY3Rpb259YCA6ICcnfWA7XG59XG4vLyMgc291cmNlTWFwcGluZ1VSTD1mb3JtYXRVbml0cy5qcy5tYXAiXSwibmFtZXMiOltdLCJzb3VyY2VSb290IjoiIn0=\n//# sourceURL=webpack-internal:///(ssr)/./node_modules/viem/_esm/utils/unit/formatUnits.js\n");

/***/ })

};
;