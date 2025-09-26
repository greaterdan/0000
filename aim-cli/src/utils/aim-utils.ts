// AIM Currency utility functions

export function aimToMicroAim(aim: number): number {
  return Math.floor(aim * 1000000);
}

export function microAimToAim(microAim: number): number {
  return microAim / 1000000;
}

export function formatAim(amount: number, decimals: number = 6): string {
  return amount.toFixed(decimals);
}

export function formatCurrency(amount: number, currency: string = 'AIM'): string {
  return `${formatAim(amount)} ${currency}`;
}

