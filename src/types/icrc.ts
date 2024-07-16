import {z} from 'zod';

export const ICRC25_REQUEST_PERMISSIONS = 'icrc25_request_permissions';
export const ICRC25_PERMISSIONS = 'icrc25_permissions';
export const ICRC25_SUPPORTED_STANDARDS = 'icrc25_supported_standards';
export const ICRC27_ACCOUNTS = 'icrc27_accounts';

export const IcrcWalletMethod = z.enum([
  ICRC25_REQUEST_PERMISSIONS,
  ICRC25_PERMISSIONS,
  ICRC25_SUPPORTED_STANDARDS,
  ICRC27_ACCOUNTS
]);

export const IcrcWalletRequestMethod = IcrcWalletMethod.exclude([
  ICRC25_REQUEST_PERMISSIONS,
  ICRC25_PERMISSIONS,
  ICRC25_SUPPORTED_STANDARDS
]);

export const ICRC25_PERMISSION_GRANTED = 'granted';
export const ICRC25_PERMISSION_DENIED = 'denied';
export const ICRC25_PERMISSION_ASK_ON_USE = 'ask_on_user';

export const IcrcWalletPermissionState = z.enum([
  ICRC25_PERMISSION_GRANTED,
  ICRC25_PERMISSION_DENIED,
  ICRC25_PERMISSION_ASK_ON_USE
]);

export const ICRC25 = 'ICRC-25';

export const IcrcWalletStandard = z.enum([ICRC25]);
