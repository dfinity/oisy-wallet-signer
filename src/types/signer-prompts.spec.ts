import {ICRC27_ACCOUNTS} from '../constants/icrc.constants';
import type {IcrcScopesArray} from './icrc-responses';
import {PermissionsPromptSchema, type PermissionsPromptPayload} from './signer-prompts';

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
});
