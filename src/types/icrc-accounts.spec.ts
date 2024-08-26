import {Principal} from '@dfinity/principal';
import {IcrcAccountSchema, IcrcAccountsSchema} from './icrc-accounts';

describe('ICRC accounts', () => {
  const principalText = 'xlmdg-vkosz-ceopx-7wtgu-g3xmd-koiyc-awqaq-7modz-zf6r6-364rh-oqe';

  describe('IcrcAccount', () => {
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
        expect(result.error.errors[0].message).toBe(
          'Invalid textual representation of a Principal.'
        );
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

  describe('IcrcAccounts', () => {
    it('should pass validation with a single valid account', () => {
      const validAccounts = [{owner: principalText}];
      const result = IcrcAccountsSchema.safeParse(validAccounts);
      expect(result.success).toBe(true);
    });

    it('should pass validation with multiple valid accounts', () => {
      const validAccounts = [
        {owner: principalText},
        {owner: Principal.anonymous().toText(), subaccount: new Uint8Array(32)}
      ];
      const result = IcrcAccountsSchema.safeParse(validAccounts);
      expect(result.success).toBe(true);
    });

    it('should fail validation with an empty array', () => {
      const result = IcrcAccountsSchema.safeParse([]);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('at least 1 element(s)');
      }
    });

    it('should fail validation with an invalid Principal string in one of the accounts', () => {
      const invalidAccounts = [
        {owner: principalText, subaccount: new Uint8Array(32)},
        {owner: 'invalid-principal'}
      ];
      const result = IcrcAccountsSchema.safeParse(invalidAccounts);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe(
          'Invalid textual representation of a Principal.'
        );
      }
    });

    it('should fail validation with a subaccount that is not 32 bytes long', () => {
      const invalidAccounts = [{owner: principalText, subaccount: new Uint8Array(31)}];
      const result = IcrcAccountsSchema.safeParse(invalidAccounts);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe('Subaccount must be exactly 32 bytes long.');
      }
    });

    it('should pass validation with an account that has no subaccount (optional field)', () => {
      const validAccounts = [{owner: principalText}];
      const result = IcrcAccountsSchema.safeParse(validAccounts);
      expect(result.success).toBe(true);
    });

    it('should fail validation when subaccount is an array of numbers but not 32 elements long', () => {
      const invalidAccounts = [{owner: principalText, subaccount: Array(20).fill(0)}];
      const result = IcrcAccountsSchema.safeParse(invalidAccounts);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe('Subaccount must be exactly 32 bytes long.');
      }
    });

    it('should fail validation when subaccount is neither Uint8Array nor an array of numbers', () => {
      const invalidAccounts = [{owner: principalText, subaccount: 'invalid-subaccount'}];
      const result = IcrcAccountsSchema.safeParse(invalidAccounts);
      expect(result.success).toBe(false);
    });
  });
});
