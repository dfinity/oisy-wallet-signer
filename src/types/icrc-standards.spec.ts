import {
  ICRC21,
  ICRC21_CALL_CONSENT_MESSAGE,
  ICRC25,
  ICRC25_PERMISSIONS,
  ICRC25_REQUEST_PERMISSIONS,
  ICRC25_SUPPORTED_STANDARDS,
  ICRC27,
  ICRC27_ACCOUNTS,
  ICRC29,
  ICRC29_STATUS
} from '../constants/icrc.constants';
import {IcrcMethodSchema, IcrcScopedMethodSchema, IcrcStandardSchema} from './icrc-standards';

describe('ICRC standards', () => {
  const methodEnums = [
    {
      title: 'ICRC21_CALL_CONSENT_MESSAGE',
      validEnum: ICRC21_CALL_CONSENT_MESSAGE
    },
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

  it.each(methodEnums)('should validate $title with IcrcMethodSchema', ({validEnum}) => {
    expect(IcrcMethodSchema.safeParse(validEnum).success).toBe(true);
  });

  it('should not validate IcrcMethodSchema unkown value', () => {
    expect(IcrcMethodSchema.safeParse('INVALID_METHOD').success).toBe(false);
  });

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

  it.each(scopeEnums)('should validate $title with IcrcScopedMethodSchema', ({validEnum}) => {
    expect(IcrcScopedMethodSchema.safeParse(validEnum).success).toBe(true);
  });

  it.each(invalidScopeEnums)(
    'should not validate $title with IcrcScopedMethodSchema',
    ({validEnum}) => {
      expect(IcrcScopedMethodSchema.safeParse(validEnum).success).toBe(false);
    }
  );

  const standardEnums = [
    {
      title: 'ICRC21',
      validEnum: ICRC21
    },
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

  it.each(standardEnums)('should validate $title with IcrcStandardSchema', ({validEnum}) => {
    expect(IcrcStandardSchema.safeParse(validEnum).success).toBe(true);
  });

  it('should not validate IcrcStandardSchema unknown enum values', () => {
    expect(IcrcStandardSchema.safeParse('INVALID_STANDARD').success).toBe(false);
  });
});
