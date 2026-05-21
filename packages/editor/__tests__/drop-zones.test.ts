import { describe, it, expect } from 'vitest';
import { resolveReorderTarget } from '../src/dnd/drop-zones.js';

describe('resolveReorderTarget', () => {
  it('returns null when the source row was not found', () => {
    expect(resolveReorderTarget(-1, 0)).toBeNull();
    expect(resolveReorderTarget(-1, 5)).toBeNull();
  });

  it('returns null when dropping on the source position', () => {
    expect(resolveReorderTarget(2, 2)).toBeNull();
  });

  it('returns null when dropping immediately after the source (no-op)', () => {
    // Dropping row 2 at "position 3" means "insert after row 2",
    // which leaves it where it is.
    expect(resolveReorderTarget(2, 3)).toBeNull();
  });

  it('shifts down by one when dragging downward', () => {
    // [A, B, C, D] — drag A (idx 0) to "between C and D" (drop idx 3)
    // After splice-out: [B, C, D], insert at 2 → [B, C, A, D] ✓
    expect(resolveReorderTarget(0, 3)).toBe(2);
  });

  it('keeps the index when dragging upward', () => {
    // [A, B, C, D] — drag D (idx 3) to "before A" (drop idx 0)
    // After splice-out: [A, B, C], insert at 0 → [D, A, B, C] ✓
    expect(resolveReorderTarget(3, 0)).toBe(0);
  });

  it('handles dragging to the very end', () => {
    // [A, B, C] — drag A (idx 0) to end (drop idx 3)
    // After splice-out: [B, C], insert at 2 → [B, C, A] ✓
    expect(resolveReorderTarget(0, 3)).toBe(2);
  });

  it('handles dragging upward by one', () => {
    // [A, B, C, D] — drag C (idx 2) to "before B" (drop idx 1)
    // After splice-out: [A, B, D], insert at 1 → [A, C, B, D] ✓
    expect(resolveReorderTarget(2, 1)).toBe(1);
  });
});
