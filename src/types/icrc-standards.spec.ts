import {
  ICRC25,
  ICRC25_PERMISSIONS,
  ICRC25_REQUEST_PERMISSIONS,
  ICRC25_SUPPORTED_STANDARDS,
  ICRC27,
  ICRC27_ACCOUNTS,
  ICRC29,
  ICRC29_STATUS
} from '../constants/icrc.constants';
import {
  IcrcWalletApproveMethodSchema,
  IcrcWalletMethodSchema,
  IcrcWalletScopedMethodSchema,
  IcrcWalletStandardSchema
} from './icrc-standards';

describe('ICRC standards', () => {
  const methodEnums = [
    {
      title: 'ICRC25_REQUEST_PERMISSIONS',
      validEnum: ICRC25_REQUEST_PERMISSIONS
    },
    {
      title: 'ICRC25_PERMISSIONS',
      validEnum: ICRC25_PERMISSIONS
    },
    {
      title: 'ICRC25_SUPPORTED_STANDARDS',
      validEnum: ICRC25_SUPPORTED_STANDARDS
    },
    {
      title: 'ICRC27_ACCOUNTS',
      validEnum: ICRC27_ACCOUNTS
    },
    {
      title: 'ICRC29_STATUS',
      validEnum: ICRC29_STATUS
    }
  ];

  it.each(methodEnums)(
    'should validate $title with IcrcWalletMethodSchema',
    async ({validEnum}) => {
      expect(IcrcWalletMethodSchema.safeParse(validEnum).success).toBe(true);
    }
  );

  it('should not validate IcrcWalletMethodSchema unkown value', () => {
    expect(IcrcWalletMethodSchema.safeParse('INVALID_METHOD').success).toBe(false);
  });

  const approveEnums = [
    {
      title: 'ICRC25_REQUEST_PERMISSIONS',
      validEnum: ICRC25_REQUEST_PERMISSIONS
    },
    {
      title: 'ICRC27_ACCOUNTS',
      validEnum: ICRC27_ACCOUNTS
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
    'should validate $title with IcrcWalletApproveMethodSchema',
    async ({validEnum}) => {
      expect(IcrcWalletApproveMethodSchema.safeParse(validEnum).success).toBe(true);
    }
  );

  it.each(invalidApproveEnums)(
    'should not validate $title with IcrcWalletApproveMethodSchema',
    async ({validEnum}) => {
      expect(IcrcWalletApproveMethodSchema.safeParse(validEnum).success).toBe(false);
    }
  );

  const scopeEnums = [
    {
      title: 'ICRC27_ACCOUNTS',
      validEnum: ICRC27_ACCOUNTS
    }
  ];

  const invalidScopeEnums = [
    {
      title: 'ICRC25_REQUEST_PERMISSIONS',
      validEnum: ICRC25_REQUEST_PERMISSIONS
    },
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

  it.each(scopeEnums)(
    'should validate $title with IcrcWalletScopedMethodSchema',
    async ({validEnum}) => {
      expect(IcrcWalletScopedMethodSchema.safeParse(validEnum).success).toBe(true);
    }
  );

  it.each(invalidScopeEnums)(
    'should not validate $title with IcrcWalletScopedMethodSchema',
    async ({validEnum}) => {
      expect(IcrcWalletScopedMethodSchema.safeParse(validEnum).success).toBe(false);
    }
  );

  const standardEnums = [
    {
      title: 'ICRC25',
      validEnum: ICRC25
    },
    {
      title: 'ICRC27',
      validEnum: ICRC27
    },
    {
      title: 'ICRC29',
      validEnum: ICRC29
    }
  ];

  it.each(standardEnums)(
    'should validate $title with IcrcWalletStandardSchema',
    async ({validEnum}) => {
      expect(IcrcWalletStandardSchema.safeParse(validEnum).success).toBe(true);
    }
  );

  it('should not validate IcrcWalletStandardSchema unknown enum values', () => {
    expect(IcrcWalletStandardSchema.safeParse('INVALID_STANDARD').success).toBe(false);
  });
});
