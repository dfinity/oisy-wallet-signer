import type {z} from 'zod';
import {
  ICRC25_PERMISSIONS,
  ICRC25_REQUEST_PERMISSIONS,
  ICRC25_SUPPORTED_STANDARDS,
  IcrcWalletScopesParams
} from './icrc';
import {inferRpcRequestWithParams, inferRpcRequestWithoutParams} from './rpc';

// https://github.com/dfinity/wg-identity-authentication/blob/main/topics/icrc_25_signer_interaction_standard.md#icrc25_request_permissions
export const IcrcWalletRequestPermissionsRequest = inferRpcRequestWithParams({
  method: ICRC25_REQUEST_PERMISSIONS,
  params: IcrcWalletScopesParams
});

export type IcrcWalletRequestPermissionsRequestType = z.infer<
  typeof IcrcWalletRequestPermissionsRequest
>;

// https://github.com/dfinity/wg-identity-authentication/blob/main/topics/icrc_25_signer_interaction_standard.md#icrc25_permissions
export const IcrcWalletPermissionsRequest = inferRpcRequestWithoutParams({
  method: ICRC25_PERMISSIONS
});

export type IcrcWalletPermissionsRequestType = z.infer<typeof IcrcWalletPermissionsRequest>;

// https://github.com/dfinity/wg-identity-authentication/blob/main/topics/icrc_25_signer_interaction_standard.md#icrc25_supported_standards
export const IcrcWalletSupportedStandardsRequest = inferRpcRequestWithoutParams({
  method: ICRC25_SUPPORTED_STANDARDS
});

export type IcrcWalletSupportedStandardsRequestType = z.infer<
  typeof IcrcWalletSupportedStandardsRequest
>;
