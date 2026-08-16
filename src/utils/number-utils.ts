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
