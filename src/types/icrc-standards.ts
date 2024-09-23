import {z} from 'zod';
import {
  ICRC21,
  ICRC21_CALL_CONSENT_MESSAGE,
  ICRC25,
  ICRC25_PERMISSION_ASK_ON_USE,
  ICRC25_PERMISSION_DENIED,
  ICRC25_PERMISSION_GRANTED,
  ICRC25_PERMISSIONS,
  ICRC25_REQUEST_PERMISSIONS,
  ICRC25_SUPPORTED_STANDARDS,
  ICRC27,
  ICRC27_ACCOUNTS,
  ICRC29,
  ICRC29_STATUS,
  ICRC49,
  ICRC49_CALL_CANISTER
} from '../constants/icrc.constants';

export const IcrcMethodSchema = z.enum([
  ICRC21_CALL_CONSENT_MESSAGE,
  ICRC25_REQUEST_PERMISSIONS,
  ICRC25_PERMISSIONS,
  ICRC25_SUPPORTED_STANDARDS,
  ICRC27_ACCOUNTS,
  ICRC29_STATUS,
  ICRC49_CALL_CANISTER
]);

export const IcrcScopedMethodSchema = IcrcMethodSchema.extract([
  ICRC27_ACCOUNTS,
  ICRC49_CALL_CANISTER
]);

export type IcrcScopedMethod = z.infer<typeof IcrcScopedMethodSchema>;

export const IcrcPermissionStateSchema = z.enum([
  ICRC25_PERMISSION_GRANTED,
  ICRC25_PERMISSION_DENIED,
  ICRC25_PERMISSION_ASK_ON_USE
]);

export type IcrcPermissionState = z.infer<typeof IcrcPermissionStateSchema>;

export const IcrcStandardSchema = z.enum([ICRC21, ICRC25, ICRC27, ICRC29, ICRC49]);
