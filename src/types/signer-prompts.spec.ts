import {
  ICRC25_PERMISSIONS,
  ICRC25_REQUEST_PERMISSIONS,
  ICRC25_SUPPORTED_STANDARDS,
  ICRC27_ACCOUNTS,
  ICRC29_STATUS,
  ICRC49_CALL_CANISTER
} from '../constants/icrc.constants';
import {mockAccounts} from '../mocks/icrc-accounts.mocks';
import type {IcrcScopesArray} from './icrc-responses';
import {
  AccountsPromptSchema,
  CallCanisterPromptSchema,
  PermissionsPromptSchema,
  PromptMethodSchema,
  type AccountsPromptPayload,
  type CallCanisterPromptPayload,
  type PermissionsPromptPayload
} from './signer-prompts';

describe('SignerPrompts', () => {
  describe('Prompts', () => {
    const approveEnums = [
      {
        title: 'ICRC25_REQUEST_PERMISSIONS',
        validEnum: ICRC25_REQUEST_PERMISSIONS
      },
      {
        title: 'ICRC27_ACCOUNTS',
        validEnum: ICRC27_ACCOUNTS
      },
      {
        title: 'ICRC49_CALL_CANISTER',
        validEnum: ICRC49_CALL_CANISTER
      }
    ];

    const invalidApproveEnums = [
      {
        title: 'ICRC25_PERMISSIONS',
        validEnum: ICRC25_PERMISSIONS
      },
      {
        title: 'ICRC25_SUPPORTED_STANDARDS',
        validEnum: ICRC25_SUPPORTED_STANDARDS
      },
      {
        title: 'ICRC29_STATUS',
        validEnum: ICRC29_STATUS
      }
    ];

    it.each(approveEnums)('should validate $title with PromptMethodSchema', async ({validEnum}) => {
      expect(PromptMethodSchema.safeParse(validEnum).success).toBe(true);
    });

    it.each(invalidApproveEnums)(
      'should not validate $title with PromptMethodSchema',
      async ({validEnum}) => {
        expect(PromptMethodSchema.safeParse(validEnum).success).toBe(false);
      }
    );
  });

  describe('Permissions', () => {
    const scopes: IcrcScopesArray = [
      {
        scope: {
          method: ICRC27_ACCOUNTS
        },
        state: 'denied'
      }
    ];

    it('should validate a PermissionsPrompt', () => {
      const prompt = (payload: PermissionsPromptPayload): void => {
        payload.confirm(scopes);
      };

      expect(() => PermissionsPromptSchema.parse(prompt)).not.toThrow();
    });

    it('should fail with an invalid PermissionsPrompt', () => {
      const invalidPrompt = 123;

      expect(() => PermissionsPromptSchema.parse(invalidPrompt)).toThrow();
    });

    it('should fail if confirm is missing in PermissionsPrompt', () => {
      const invalidPrompt = {
        requestedScopes: scopes,
        origin: 'example.com'
      }; // confirm is missing

      expect(() => PermissionsPromptSchema.parse(invalidPrompt)).toThrow();
    });
  });

  describe('Accounts', () => {
    it('should validate an AccountsPrompt', () => {
      const prompt = (payload: AccountsPromptPayload): void => {
        payload.approve(mockAccounts);
      };

      expect(() => AccountsPromptSchema.parse(prompt)).not.toThrow();
    });

    it('should fail with an invalid AccountsPrompt', () => {
      const invalidPrompt = 123;

      expect(() => AccountsPromptSchema.parse(invalidPrompt)).toThrow();
    });

    it('should fail if approve or reject is missing in AccountsPrompt', () => {
      const invalidPrompt = {
        origin: 'example.com'
      };

      expect(() => AccountsPromptSchema.parse(invalidPrompt)).toThrow();
    });
  });

  describe('Call Canister', () => {
    it('should validate a ConsentMessagePrompt', () => {
      const prompt = (payload: CallCanisterPromptPayload): void => {
        if (payload.type === 'consentMessage' && 'approve' in payload) {
          payload.approve();
        }
      };

      expect(() => CallCanisterPromptSchema.parse(prompt)).not.toThrow();
    });

    it('should validate a ProcessingPrompt', () => {
      const prompt = (payload: CallCanisterPromptPayload): void => {
        if (payload.type === 'processing') {
          expect(payload.step).toBe('callCanister');
        }
      };

      expect(() => CallCanisterPromptSchema.parse(prompt)).not.toThrow();
    });

    it('should validate a CallCanisterResultPrompt', () => {
      const prompt = (payload: CallCanisterPromptPayload): void => {
        if (payload.type === 'callCanister') {
          expect(payload.payload.result).toBe('success');
        }
      };

      expect(() => CallCanisterPromptSchema.parse(prompt)).not.toThrow();
    });

    it('should fail with an invalid ConsentMessagePrompt', () => {
      const invalidPrompt = 123;

      expect(() => CallCanisterPromptSchema.parse(invalidPrompt)).toThrow();
    });

    it('should fail if result is missing in CallCanisterResultPrompt', () => {
      const invalidPrompt = {
        type: 'callCanister',
        payload: {}
      };

      expect(() => CallCanisterPromptSchema.parse(invalidPrompt)).toThrow();
    });
  });
});
