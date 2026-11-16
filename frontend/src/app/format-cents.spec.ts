import fc from 'fast-check';
import { formatCents } from './format-cents';

describe('formatCents', () => {
  it('formats the starting cash', () => {
    expect(formatCents(2000)).toBe('$20.00');
  });

  it('pads cents below 10', () => {
    expect(formatCents(5)).toBe('$0.05');
    expect(formatCents(1905)).toBe('$19.05');
  });

  it('loses no cent for any non-negative amount', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 1_000_000_000 }), (cents) => {
        const match = /^\$(\d+)\.(\d{2})$/.exec(formatCents(cents));
        expect(match).not.toBeNull();
        expect(Number(match![1]) * 100 + Number(match![2])).toBe(cents);
      }),
    );
  });
});
