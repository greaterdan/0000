"use strict";
// AIM Currency utility functions
Object.defineProperty(exports, "__esModule", { value: true });
exports.aimToMicroAim = aimToMicroAim;
exports.microAimToAim = microAimToAim;
exports.formatAim = formatAim;
exports.formatCurrency = formatCurrency;
function aimToMicroAim(aim) {
    return Math.floor(aim * 1000000);
}
function microAimToAim(microAim) {
    return microAim / 1000000;
}
function formatAim(amount, decimals = 6) {
    return amount.toFixed(decimals);
}
function formatCurrency(amount, currency = 'AIM') {
    return `${formatAim(amount)} ${currency}`;
}
//# sourceMappingURL=aim-utils.js.map