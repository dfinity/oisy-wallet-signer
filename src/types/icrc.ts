import {z} from 'zod';

export const ICRC25_REQUEST_PERMISSIONS = 'icrc25_request_permissions';
export const ICRC25_PERMISSIONS = 'icrc25_permissions';
export const ICRC25_SUPPORTED_STANDARDS = 'icrc25_supported_standards';

export const IcrcWalletMethod = z.enum([
  ICRC25_REQUEST_PERMISSIONS,
  ICRC25_PERMISSIONS,
  ICRC25_SUPPORTED_STANDARDS
]);

const IcrcWalletRequestMethod = IcrcWalletMethod.exclude([
  ICRC25_REQUEST_PERMISSIONS,
  ICRC25_PERMISSIONS,
  ICRC25_SUPPORTED_STANDARDS
]);

const IcrcWalletScopes = z.array(
  z.object({
    method: IcrcWalletRequestMethod
  })
);

export const IcrcWalletScopesParams = z.object({
  scopes: IcrcWalletScopes
});
