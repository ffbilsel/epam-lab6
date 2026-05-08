/** Abstract clock for deterministic tests. */
export interface Clock {
  /** Returns "now" as a Date. */
  now(): Date;
}

/** Wall-clock implementation. */
export const systemClock: Clock = {
  now: (): Date => new Date(),
};

/**
 * Build a clock that always returns `date`. Useful for fixing time in tests.
 * @param date The instant to freeze.
 */
export function fixedClock(date: Date): Clock {
  return { now: () => new Date(date.getTime()) };
}
