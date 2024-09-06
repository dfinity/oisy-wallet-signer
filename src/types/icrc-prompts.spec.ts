import {
  ICRC25_PERMISSIONS,
  ICRC25_REQUEST_PERMISSIONS,
  ICRC25_SUPPORTED_STANDARDS,
  ICRC27_ACCOUNTS,
  ICRC29_STATUS
} from '../constants/icrc.constants';
import {IcrcApproveMethodSchema} from './icrc-prompts';

describe('ICRC prompts', () => {
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
    'should validate $title with IcrcApproveMethodSchema',
    async ({validEnum}) => {
      expect(IcrcApproveMethodSchema.safeParse(validEnum).success).toBe(true);
    }
  );

  it.each(invalidApproveEnums)(
    'should not validate $title with IcrcApproveMethodSchema',
    async ({validEnum}) => {
      expect(IcrcApproveMethodSchema.safeParse(validEnum).success).toBe(false);
    }
  );
});
