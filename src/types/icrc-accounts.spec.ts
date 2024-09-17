import {Principal} from '@dfinity/principal';
import {mockPrincipalText} from '../mocks/icrc-accounts.mocks';
import {uint8ArrayToBase64} from '../utils/base64.utils';
import {IcrcAccountSchema, IcrcAccountsSchema} from './icrc-accounts';

describe('ICRC accounts', () => {
  describe('IcrcAccount', () => {
    it('should pass validation with a valid owner', () => {
      const validAccount = {
        owner: mockPrincipalText
      };
      const result = IcrcAccountSchema.safeParse(validAccount);
      expect(result.success).toBe(true);
    });

    it('should pass validation with a valid owner and optional subaccount', () => {
      const validAccount = {
        owner: mockPrincipalText,
        subaccount: uint8ArrayToBase64(new Uint8Array(32))
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
        owner: mockPrincipalText,
        subaccount: uint8ArrayToBase64(new Uint8Array(31))
      };
      const result = IcrcAccountSchema.safeParse(invalidAccount);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe('Subaccount must be exactly 32 bytes long.');
      }
    });

    it('should fail validation when subaccount is not a blob', () => {
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
      const validAccounts = [{owner: mockPrincipalText}];
      const result = IcrcAccountsSchema.safeParse(validAccounts);
      expect(result.success).toBe(true);
    });

    it('should pass validation with multiple valid accounts', () => {
      const validAccounts = [
        {owner: mockPrincipalText},
        {owner: Principal.anonymous().toText(), subaccount: uint8ArrayToBase64(new Uint8Array(32))}
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
        {owner: mockPrincipalText, subaccount: uint8ArrayToBase64(new Uint8Array(32))},
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
      const invalidAccounts = [
        {owner: mockPrincipalText, subaccount: uint8ArrayToBase64(new Uint8Array(31))}
      ];
      const result = IcrcAccountsSchema.safeParse(invalidAccounts);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe('Subaccount must be exactly 32 bytes long.');
      }
    });

    it('should pass validation with an account that has no subaccount (optional field)', () => {
      const validAccounts = [{owner: mockPrincipalText}];
      const result = IcrcAccountsSchema.safeParse(validAccounts);
      expect(result.success).toBe(true);
    });

    it('should fail validation when subaccount is not a blob', () => {
      const invalidAccounts = [{owner: mockPrincipalText, subaccount: 'invalid-subaccount'}];
      const result = IcrcAccountsSchema.safeParse(invalidAccounts);
      expect(result.success).toBe(false);
    });
  });
});
