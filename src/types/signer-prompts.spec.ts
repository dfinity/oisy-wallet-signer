import {mockAccounts} from '../constants/icrc-accounts.mocks';
import {ICRC27_ACCOUNTS} from '../constants/icrc.constants';
import type {IcrcScopesArray} from './icrc-responses';
import {
  AccountsPromptSchema,
  PermissionsPromptSchema,
  type AccountsPromptPayload,
  type PermissionsPromptPayload
} from './signer-prompts';

describe('SignerPrompts', () => {
  describe('Permissions', () => {
    const scopes: IcrcScopesArray = [
      {
        scope: {
          method: ICRC27_ACCOUNTS
        },
        state: 'denied'
      }
    ];

    it('should validate a prompt', () => {
      const prompt = (payload: PermissionsPromptPayload): void => {
        payload.confirmScopes(scopes);
      };

      expect(() => PermissionsPromptSchema.parse(prompt)).not.toThrow();
    });

    it('should fail with invalid prompt', () => {
      const invalidPrompt = 123;

      expect(() => PermissionsPromptSchema.parse(invalidPrompt)).toThrow();
    });
  });

  describe('Accounts', () => {
    it('should validate an AccountsPrompt', () => {
      const prompt = (payload: AccountsPromptPayload): void => {
        payload.confirmAccounts(mockAccounts);
      };

      expect(() => AccountsPromptSchema.parse(prompt)).not.toThrow();
    });

    it('should fail with invalid AccountsPrompt', () => {
      const invalidPrompt = 123;

      expect(() => AccountsPromptSchema.parse(invalidPrompt)).toThrow();
    });
  });
});
