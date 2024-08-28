import {IDL} from '@dfinity/candid';
import {mockPrincipalText} from '../constants/icrc-accounts.mocks';
import {
  WalletRequestOptionsSchema,
  extendIcrcCallCanisterRequestParamsSchema,
  type WalletCallParams
} from './wallet-request';

describe('WalletRequest', () => {
  describe('Options', () => {
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

  describe('Call', () => {
    interface MyTest {
      hello: string;
    }

    const argType = IDL.Record({
      hello: IDL.Text
    });

    const schema = extendIcrcCallCanisterRequestParamsSchema<MyTest>();

    it('should validate correct parameters', () => {
      const validParams: WalletCallParams<{hello: string}> = {
        canisterId: mockPrincipalText,
        sender: mockPrincipalText,
        method: 'some_method',
        arg: {hello: 'world'},
        argType
      };

      const result = schema.safeParse(validParams);
      expect(result.success).toBe(true);
    });

    // TODO: not sure how to solve this with zod that's why this test succeed.
    it('should validate incorrect "arg" type', () => {
      const invalidParams = {
        canisterId: mockPrincipalText,
        sender: mockPrincipalText,
        method: 'some_method',
        arg: 'invalid_arg',
        argType
      };

      const result = schema.safeParse(invalidParams);
      expect(result.success).toBe(true);
    });

    it('should fail validation with missing "argType"', () => {
      const invalidParams = {
        canisterId: mockPrincipalText,
        sender: mockPrincipalText,
        method: 'some_method',
        arg: {hello: 'world'}
      };

      const result = schema.safeParse(invalidParams);
      expect(result.success).toBe(false);
    });

    it('should fail validation with missing "arg"', () => {
      const invalidParams = {
        canisterId: mockPrincipalText,
        sender: mockPrincipalText,
        method: 'some_method',
        argType
      };

      const result = schema.safeParse(invalidParams);
      expect(result.success).toBe(false);
    });

    it('should fail validation with missing "canisterId"', () => {
      const invalidParams = {
        sender: mockPrincipalText,
        method: 'some_method',
        arg: {hello: 'world'},
        argType
      };

      const result = schema.safeParse(invalidParams);
      expect(result.success).toBe(false);
    });

    it('should fail validation with missing "sender"', () => {
      const invalidParams = {
        canisterId: mockPrincipalText,
        method: 'some_method',
        arg: {hello: 'world'},
        argType
      };

      const result = schema.safeParse(invalidParams);
      expect(result.success).toBe(false);
    });

    it('should fail validation with missing "method"', () => {
      const invalidParams = {
        canisterId: mockPrincipalText,
        sender: mockPrincipalText,
        arg: {hello: 'world'},
        argType
      };

      const result = schema.safeParse(invalidParams);
      expect(result.success).toBe(false);
    });
  });
});
