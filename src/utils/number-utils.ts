/**
 * Constrains a number value within the provided boundaries.
 *
 * @param {number} value Value to be constrained.
 * @param {number} min Minimum value boundary.
 * @param {number} max Maximum value boundary.
 * @returns {number} The value, unless it exceeds the boundaries, in which case the encroaching boundary value is returned.
 * @throws {Error} If the minimum boundary is greater than or equal to the maximum boundary.
 */
export function boundValue(value: number, min: number, max: number): number {
  if (min >= max) {
    throw new Error(
      `Invalid boundValue boundaries: min (${min}) cannot be greater than or equal to max (${max}).`,
    );
  }

  return Math.min(max, Math.max(min, value));
}

/**
 * Formats a number with locale-aware grouping, collapsing to K/M/B suffixes above thresholds.
 *
 * @param {number} value Number to format.
 * @param {number} [decimals=0] Decimal places for the formatted output.
 * @returns {string} Formatted string, e.g. "1,234", "12.3K", "1.5M".
 */
export function formatNumber(value: number, decimals: number = 0): string {
  const abs = Math.abs(value);

  if (abs >= 1_000_000_000) {
    return (value / 1_000_000_000).toFixed(1) + 'B';
  }

  if (abs >= 1_000_000) {
    return (value / 1_000_000).toFixed(1) + 'M';
  }

  if (abs >= 100_000) {
    return (value / 1_000).toFixed(1) + 'K';
  }

  return value.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/**
 * Formats a decimal ratio as a percentage string.
 *
 * @param {number} ratio Decimal ratio (0–1 range, though values outside are formatted as-is).
 * @param {number} [decimals=1] Decimal places in the output.
 * @returns {string} Percentage string, e.g. "85.3%".
 */
export function formatPercent(ratio: number, decimals: number = 2): string {
  return (ratio * 100).toFixed(decimals) + '%';
}
