import {Principal} from '@dfinity/principal';
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
    const principalText = 'xlmdg-vkosz-ceopx-7wtgu-g3xmd-koiyc-awqaq-7modz-zf6r6-364rh-oqe';

    const accounts = [
      {owner: principalText},
      {owner: Principal.anonymous().toText(), subaccount: new Uint8Array(32)}
    ];

    it('should validate an AccountsPrompt', () => {
      const prompt = (payload: AccountsPromptPayload): void => {
        payload.confirmAccounts(accounts);
      };

      expect(() => AccountsPromptSchema.parse(prompt)).not.toThrow();
    });

    it('should fail with invalid AccountsPrompt', () => {
      const invalidPrompt = 123;

      expect(() => AccountsPromptSchema.parse(invalidPrompt)).toThrow();
    });
  });
});
