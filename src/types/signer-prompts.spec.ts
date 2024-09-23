import {
  ICRC21_CALL_CONSENT_MESSAGE,
  ICRC25_PERMISSIONS,
  ICRC25_REQUEST_PERMISSIONS,
  ICRC25_SUPPORTED_STANDARDS,
  ICRC27_ACCOUNTS,
  ICRC29_STATUS
} from '../constants/icrc.constants';
import {mockAccounts} from '../mocks/icrc-accounts.mocks';
import type {IcrcScopesArray} from './icrc-responses';
import {
  AccountsPromptSchema,
  ConsentMessagePromptSchema,
  PermissionsPromptSchema,
  PromptMethodSchema,
  type AccountsPromptPayload,
  type ConsentMessagePrompt,
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
        title: 'ICRC21_CALL_CONSENT_MESSAGE',
        validEnum: ICRC21_CALL_CONSENT_MESSAGE
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

    it.each(approveEnums)(
      'should validate $title with IcrcApproveMethodSchema',
      async ({validEnum}) => {
        expect(PromptMethodSchema.safeParse(validEnum).success).toBe(true);
      }
    );

    it.each(invalidApproveEnums)(
      'should not validate $title with IcrcApproveMethodSchema',
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

    it('should validate a prompt', () => {
      const prompt = (payload: PermissionsPromptPayload): void => {
        payload.confirm(scopes);
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
        payload.approve(mockAccounts);
      };

      expect(() => AccountsPromptSchema.parse(prompt)).not.toThrow();
    });

    it('should fail with invalid AccountsPrompt', () => {
      const invalidPrompt = 123;

      expect(() => AccountsPromptSchema.parse(invalidPrompt)).toThrow();
    });
  });

  describe('Consent message', () => {
    it('should validate a ConsentMessagePrompt with status "load"', () => {
      const prompt: ConsentMessagePrompt = (payload) => {
        if (payload.status === 'loading') {
          // Do nothing
        }
      };

      expect(() => ConsentMessagePromptSchema.parse(prompt)).not.toThrow();
    });

    it('should validate a ConsentMessagePrompt with status "result"', () => {
      const prompt: ConsentMessagePrompt = (payload) => {
        if (payload.status === 'result') {
          payload.approve();
        }
      };

      expect(() => ConsentMessagePromptSchema.parse(prompt)).not.toThrow();
    });

    it('should validate a ConsentMessagePrompt with status "error"', () => {
      const prompt: ConsentMessagePrompt = (payload) => {
        if (payload.status === 'error') {
          // Do nothing
        }
      };

      expect(() => ConsentMessagePromptSchema.parse(prompt)).not.toThrow();
    });
  });
});
