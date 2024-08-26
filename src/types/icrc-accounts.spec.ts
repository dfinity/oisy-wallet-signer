import {Principal} from '@dfinity/principal';
import {IcrcAccountSchema} from './icrc-accounts';

describe('ICRC accounts', () => {
  const principalText = 'xlmdg-vkosz-ceopx-7wtgu-g3xmd-koiyc-awqaq-7modz-zf6r6-364rh-oqe';

  it('should pass validation with a valid owner', () => {
    const validAccount = {
      owner: principalText,
      subaccount: new Uint8Array(32)
    };
    const result = IcrcAccountSchema.safeParse(validAccount);
    expect(result.success).toBe(true);
  });

  it('should pass validation with a valid owner and optional subaccount', () => {
    const validAccount = {
      owner: principalText,
      subaccount: new Uint8Array(32)
    };
    const result = IcrcAccountSchema.safeParse(validAccount);
    expect(result.success).toBe(true);
  });

  it('should pass validation with an anonymous principal', () => {
    const validAccount = {
      owner: Principal.anonymous().toText()
    };
    const result = IcrcAccountSchema.safeParse(validAccount);
    expect(result.success).toBe(true);
  });

  it('should fail validation with an invalid Principal string', () => {
    const invalidAccount = {
      owner: 'invalid-principal'
    };
    const result = IcrcAccountSchema.safeParse(invalidAccount);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toBe('Invalid textual representation of a Principal.');
    }
  });

  it('should fail validation with a subaccount that is not 32 bytes long', () => {
    const invalidAccount = {
      owner: principalText,
      subaccount: new Uint8Array(31)
    };
    const result = IcrcAccountSchema.safeParse(invalidAccount);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toBe('Subaccount must be exactly 32 bytes long.');
    }
  });

  it('should fail validation when subaccount is an array of numbers but not 32 elements long', () => {
    const invalidAccount = {
      owner: principalText,
      subaccount: Array(20).fill(0)
    };
    const result = IcrcAccountSchema.safeParse(invalidAccount);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toBe('Subaccount must be exactly 32 bytes long.');
    }
  });

  it('should fail validation when subaccount is neither Uint8Array nor an array of numbers', () => {
    const invalidAccount = {
      owner: Principal.anonymous().toText(),
      subaccount: 'invalid-subaccount'
    };
    const result = IcrcAccountSchema.safeParse(invalidAccount);
    expect(result.success).toBe(false);
  });
});
