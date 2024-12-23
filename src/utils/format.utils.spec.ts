import {formatAmount} from './format.utils';

describe('formatAmount', () => {
  it('formats amounts with the specified decimals', () => {
    expect(formatAmount({amount: 123456n, decimals: 2})).toBe('1,234.56');
    expect(formatAmount({amount: 1000000n, decimals: 6})).toBe('1.000000');
  });

  it('formats zero amount with decimals', () => {
    expect(formatAmount({amount: 0n, decimals: 2})).toBe('0.00');
    expect(formatAmount({amount: 0n, decimals: 6})).toBe('0.000000');
  });

  it('handles large amounts properly', () => {
    expect(formatAmount({amount: 123456789012345n, decimals: 8})).toBe('1,234,567.89012345');
  });

  it('handles small decimals without rounding errors', () => {
    expect(formatAmount({amount: 1n, decimals: 8})).toBe('0.00000001');
    expect(formatAmount({amount: 10n, decimals: 8})).toBe('0.00000010');
    expect(formatAmount({amount: 100n, decimals: 8})).toBe('0.00000100');
    expect(formatAmount({amount: 100_000_000n, decimals: 8})).toBe('1.00000000');
    expect(formatAmount({amount: 1_000_000_000n, decimals: 8})).toBe('10.00000000');
    expect(formatAmount({amount: 1_010_000_000n, decimals: 8})).toBe('10.10000000');
    expect(formatAmount({amount: 1_012_300_000n, decimals: 8})).toBe('10.12300000');
    expect(formatAmount({amount: 20_000_000_000n, decimals: 8})).toBe('200.00000000');
    expect(formatAmount({amount: 20_000_000_001n, decimals: 8})).toBe('200.00000001');
    expect(formatAmount({amount: 200_000_000_000n, decimals: 8})).toBe(`2,000.00000000`);
    expect(formatAmount({amount: 200_000_000_000_000n, decimals: 8})).toBe(`2,000,000.00000000`);
  });

  it('throws an error for invalid decimals', () => {
    expect(() => formatAmount({amount: 100n, decimals: -1})).toThrow();
  });
});
