import {z} from 'zod';
import {
  ICRC25,
  ICRC25_PERMISSION_ASK_ON_USE,
  ICRC25_PERMISSION_DENIED,
  ICRC25_PERMISSION_GRANTED,
  ICRC25_PERMISSIONS,
  ICRC25_REQUEST_PERMISSIONS,
  ICRC25_SUPPORTED_STANDARDS,
  ICRC27_ACCOUNTS,
  ICRC29,
  ICRC29_STATUS
} from '../constants/icrc.constants';

export const IcrcWalletMethodSchema = z.enum([
  ICRC25_REQUEST_PERMISSIONS,
  ICRC25_PERMISSIONS,
  ICRC25_SUPPORTED_STANDARDS,
  ICRC27_ACCOUNTS,
  ICRC29_STATUS
]);

export const IcrcWalletScopedMethodSchema = IcrcWalletMethodSchema.extract([ICRC27_ACCOUNTS]);

export const IcrcWalletPermissionStateSchema = z.enum([
  ICRC25_PERMISSION_GRANTED,
  ICRC25_PERMISSION_DENIED,
  ICRC25_PERMISSION_ASK_ON_USE
]);

export const IcrcWalletStandardSchema = z.enum([ICRC25, ICRC29]);
