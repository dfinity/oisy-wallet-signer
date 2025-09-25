import {Principal} from '@icp-sdk/core/principal';
import {uint8ArrayToBase64} from '@dfinity/utils';
import {mockPrincipalText} from '../mocks/icrc-accounts.mocks';
import {IcrcAccountSchema, IcrcAccountsSchema} from './icrc-accounts';

describe('ICRC accounts', () => {
  describe('IcrcAccount', () => {
    it('should pass validation with a valid owner', () => {
      const validAccount = {
        owner: mockPrincipalText
      };
      const result = IcrcAccountSchema.safeParse(validAccount);

      expect(result.success).toBeTruthy();
    });

    it('should pass validation with a valid owner and optional subaccount', () => {
      const validAccount = {
        owner: mockPrincipalText,
        subaccount: uint8ArrayToBase64(new Uint8Array(32))
      };
      const result = IcrcAccountSchema.safeParse(validAccount);

      expect(result.success).toBeTruthy();
    });

    it('should pass validation with an anonymous principal', () => {
      const validAccount = {
        owner: Principal.anonymous().toText()
      };
      const result = IcrcAccountSchema.safeParse(validAccount);

      expect(result.success).toBeTruthy();
    });

    it('should fail validation with an invalid Principal string', () => {
      const invalidAccount = {
        owner: 'invalid-principal'
      };
      const result = IcrcAccountSchema.safeParse(invalidAccount);

      expect(result.success).toBeFalsy();

      if (!result.success) {
        expect(result.error.issues).toEqual([
          {
            code: 'custom',
            message: 'Invalid textual representation of a Principal.',
            path: ['owner']
          }
        ]);
      }
    });

    it('should fail validation with a subaccount that is not 32 bytes long', () => {
      const invalidAccount = {
        owner: mockPrincipalText,
        subaccount: uint8ArrayToBase64(new Uint8Array(31))
      };
      const result = IcrcAccountSchema.safeParse(invalidAccount);

      expect(result.success).toBeFalsy();

      if (!result.success) {
        expect(result.error.issues).toEqual([
          {
            code: 'custom',
            message: 'Subaccount must be exactly 32 bytes long.',
            path: ['subaccount']
          }
        ]);
      }
    });

    it('should fail validation when subaccount is not a blob', () => {
      const invalidAccount = {
        owner: Principal.anonymous().toText(),
        subaccount: 'invalid-subaccount'
      };
      const result = IcrcAccountSchema.safeParse(invalidAccount);

      expect(result.success).toBeFalsy();
    });
  });

  describe('IcrcAccounts', () => {
    it('should pass validation with a single valid account', () => {
      const validAccounts = [{owner: mockPrincipalText}];
      const result = IcrcAccountsSchema.safeParse(validAccounts);

      expect(result.success).toBeTruthy();
    });

    it('should pass validation with multiple valid accounts', () => {
      const validAccounts = [
        {owner: mockPrincipalText},
        {owner: Principal.anonymous().toText(), subaccount: uint8ArrayToBase64(new Uint8Array(32))}
      ];
      const result = IcrcAccountsSchema.safeParse(validAccounts);

      expect(result.success).toBeTruthy();
    });

    it('should fail validation with an empty array', () => {
      const result = IcrcAccountsSchema.safeParse([]);

      expect(result.success).toBeFalsy();

      if (!result.success) {
        expect(result.error.issues).toEqual([
          {
            code: 'too_small',
            inclusive: true,
            message: 'Too small: expected array to have >=1 items',
            minimum: 1,
            origin: 'array',
            path: []
          }
        ]);
      }
    });

    it('should fail validation with an invalid Principal string in one of the accounts', () => {
      const invalidAccounts = [
        {owner: mockPrincipalText, subaccount: uint8ArrayToBase64(new Uint8Array(32))},
        {owner: 'invalid-principal'}
      ];
      const result = IcrcAccountsSchema.safeParse(invalidAccounts);

      expect(result.success).toBeFalsy();

      if (!result.success) {
        expect(result.error.issues).toEqual([
          {
            code: 'custom',
            message: 'Invalid textual representation of a Principal.',
            path: [1, 'owner']
          }
        ]);
      }
    });

    it('should fail validation with a subaccount that is not 32 bytes long', () => {
      const invalidAccounts = [
        {owner: mockPrincipalText, subaccount: uint8ArrayToBase64(new Uint8Array(31))}
      ];
      const result = IcrcAccountsSchema.safeParse(invalidAccounts);

      expect(result.success).toBeFalsy();

      if (!result.success) {
        expect(result.error.issues).toEqual([
          {
            code: 'custom',
            message: 'Subaccount must be exactly 32 bytes long.',
            path: [0, 'subaccount']
          }
        ]);
      }
    });

    it('should pass validation with an account that has no subaccount (optional field)', () => {
      const validAccounts = [{owner: mockPrincipalText}];
      const result = IcrcAccountsSchema.safeParse(validAccounts);

      expect(result.success).toBeTruthy();
    });

    it('should fail validation when subaccount is not a blob', () => {
      const invalidAccounts = [{owner: mockPrincipalText, subaccount: 'invalid-subaccount'}];
      const result = IcrcAccountsSchema.safeParse(invalidAccounts);

      expect(result.success).toBeFalsy();
    });
  });
});
