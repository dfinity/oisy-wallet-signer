import {WalletRequestOptionsSchema} from './wallet-request';

describe('WalletRequest', () => {
  it('should validate with a specified timeoutInMilliseconds', () => {
    const validData = {
      timeoutInMilliseconds: 3000
    };

    const result = WalletRequestOptionsSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('should validate without specifying timeoutInMilliseconds', () => {
    const validData = {};

    const result = WalletRequestOptionsSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('should fail validation with a non-numeric timeoutInMilliseconds', () => {
    const invalidData = {
      timeoutInMilliseconds: 'three thousand'
    };

    const result = WalletRequestOptionsSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });
});
