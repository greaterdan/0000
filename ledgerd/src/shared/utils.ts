import { MICRO_AIM_PER_AIM } from './types';

/**
 * Generate a deterministic hash for journal entries
 */
export function generateLeafHash(
  type: string,
  payload: Record<string, any>,
  prevHash: string,
  timestamp: Date
): string {
  const data = JSON.stringify({
    type,
    payload,
    prevHash,
    timestamp: timestamp.toISOString(),
  });
  
  // Simple hash function for demo - in production use SHA-256
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return hash.toString(16);
}

/**
 * Calculate demurrage amount
 */
export function calculateDemurrage(
  balance: string,
  annualRate: number,
  days: number = 1
): string {
  const balanceNum = parseFloat(balance);
  if (balanceNum <= 0) return '0';
  
  const dailyRate = annualRate / 365;
  const demurrageAmount = balanceNum * dailyRate * days;
  return Math.floor(demurrageAmount).toString();
}

/**
 * Validate microAIM amount
 */
export function validateMicroAimAmount(amount: string): boolean {
  const num = parseFloat(amount);
  return !isNaN(num) && num >= 0 && Number.isInteger(num);
}
