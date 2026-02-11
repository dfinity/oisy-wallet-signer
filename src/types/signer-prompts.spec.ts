import {
  ICRC21_CALL_CONSENT_MESSAGE,
  ICRC25_PERMISSION_DENIED,
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
  ConsentMessagePromptSchema,
  PermissionsPromptSchema,
  PromptMethodSchema,
  type AccountsPromptPayload,
  type CallCanisterPromptPayload,
  type ConsentMessagePrompt,
  type PermissionsPromptPayload
} from './signer-prompts';

describe('SignerPrompts', () => {
  describe('Prompts', () => {
    const approveEnums = [
      {
        title: 'ICRC21_CALL_CONSENT_MESSAGE',
        validEnum: ICRC21_CALL_CONSENT_MESSAGE
      },
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

    it.each(approveEnums)('should validate $title with IcrcApproveMethodSchema', ({validEnum}) => {
      expect(PromptMethodSchema.safeParse(validEnum).success).toBeTruthy();
    });

    it.each(invalidApproveEnums)(
      'should not validate $title with IcrcApproveMethodSchema',
      ({validEnum}) => {
        expect(PromptMethodSchema.safeParse(validEnum).success).toBeFalsy();
      }
    );
  });

  describe('Permissions', () => {
    const scopes: IcrcScopesArray = [
      {
        scope: {
          method: ICRC27_ACCOUNTS
        },
        state: ICRC25_PERMISSION_DENIED
      }
    ];

    it('should validate a prompt', () => {
      const prompt = (payload: PermissionsPromptPayload): void => {
        payload.confirm(scopes);
      };

      expect(() => PermissionsPromptSchema.parse(prompt)).not.toThrowError();
    });

    it('should fail with invalid prompt', () => {
      const invalidPrompt = 123;

      expect(() => PermissionsPromptSchema.parse(invalidPrompt)).toThrowError();
    });
  });

  describe('Accounts', () => {
    it('should validate an AccountsPrompt', () => {
      const prompt = (payload: AccountsPromptPayload): void => {
        payload.approve(mockAccounts);
      };

      expect(() => AccountsPromptSchema.parse(prompt)).not.toThrowError();
    });

    it('should fail with invalid AccountsPrompt', () => {
      const invalidPrompt = 123;

      expect(() => AccountsPromptSchema.parse(invalidPrompt)).toThrowError();
    });
  });

  describe('Consent message', () => {
    it('should validate a ConsentMessagePrompt with status "load"', () => {
      const prompt: ConsentMessagePrompt = (payload) => {
        if (payload.status === 'loading') {
          // Do nothing
        }
      };

      expect(() => ConsentMessagePromptSchema.parse(prompt)).not.toThrowError();
    });

    it('should validate a ConsentMessagePrompt with status "result"', () => {
      const prompt: ConsentMessagePrompt = (payload) => {
        if (payload.status === 'result') {
          payload.approve();
        }
      };

      expect(() => ConsentMessagePromptSchema.parse(prompt)).not.toThrowError();
    });

    it('should validate a ConsentMessagePrompt with status "error"', () => {
      const prompt: ConsentMessagePrompt = (payload) => {
        if (payload.status === 'error') {
          // Do nothing
        }
      };

      expect(() => ConsentMessagePromptSchema.parse(prompt)).not.toThrowError();
    });
  });

  describe('CallCanister prompt', () => {
    it('should validate a CallCanisterPrompt with status "loading"', () => {
      const prompt = (payload: CallCanisterPromptPayload): void => {
        if (payload.status === 'executing') {
          // Do nothing
        }
      };

      expect(() => CallCanisterPromptSchema.parse(prompt)).not.toThrowError();
    });

    it('should validate a CallCanisterPrompt with status "result"', () => {
      const prompt = (payload: CallCanisterPromptPayload): void => {
        if (payload.status === 'result') {
          // Do nothing
        }
      };

      expect(() => CallCanisterPromptSchema.parse(prompt)).not.toThrowError();
    });

    it('should validate a CallCanisterPrompt with status "error"', () => {
      const prompt = (payload: CallCanisterPromptPayload): void => {
        if (payload.status === 'error') {
          // Do nothing
        }
      };

      expect(() => CallCanisterPromptSchema.parse(prompt)).not.toThrowError();
    });

    it('should fail with an invalid CallCanisterPrompt', () => {
      const invalidPrompt = 123;

      expect(() => CallCanisterPromptSchema.parse(invalidPrompt)).toThrowError();
    });
  });
});
