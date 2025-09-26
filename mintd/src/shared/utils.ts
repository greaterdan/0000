/**
 * Calculate mint amount based on score and policy
 */
export function calculateMintAmount(
  score: number,
  baseAmount: number = 100000,
  threshold: number = 0.85
): string {
  if (score < threshold) {
    return '0';
  }
  
  // Linear scaling from threshold to 1.0
  const scaledScore = (score - threshold) / (1.0 - threshold);
  const amount = Math.floor(baseAmount * scaledScore);
  return amount.toString();
}
