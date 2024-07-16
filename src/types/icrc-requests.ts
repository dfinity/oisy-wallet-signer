import {z} from 'zod';
import {
  ICRC25_PERMISSIONS,
  ICRC25_REQUEST_PERMISSIONS,
  ICRC25_SUPPORTED_STANDARDS,
  IcrcWalletRequestMethod
} from './icrc';
import {inferRpcRequestWithParams, inferRpcRequestWithoutParams} from './rpc';

const IcrcWalletScopesParams = z.object({
  scopes: z.array(
    z.object({
      method: IcrcWalletRequestMethod
    })
  )
});

// icrc25_request_permissions
// https://github.com/dfinity/wg-identity-authentication/blob/main/topics/icrc_25_signer_interaction_standard.md#icrc25_request_permissions
export const IcrcWalletRequestPermissionsRequest = inferRpcRequestWithParams({
  method: ICRC25_REQUEST_PERMISSIONS,
  params: IcrcWalletScopesParams
});

export type IcrcWalletRequestPermissionsRequestType = z.infer<
  typeof IcrcWalletRequestPermissionsRequest
>;

// icrc25_permissions
// https://github.com/dfinity/wg-identity-authentication/blob/main/topics/icrc_25_signer_interaction_standard.md#icrc25_permissions
export const IcrcWalletPermissionsRequest = inferRpcRequestWithoutParams({
  method: ICRC25_PERMISSIONS
});

export type IcrcWalletPermissionsRequestType = z.infer<typeof IcrcWalletPermissionsRequest>;

// icrc25_supported_standards
// https://github.com/dfinity/wg-identity-authentication/blob/main/topics/icrc_25_signer_interaction_standard.md#icrc25_supported_standards
export const IcrcWalletSupportedStandardsRequest = inferRpcRequestWithoutParams({
  method: ICRC25_SUPPORTED_STANDARDS
});

export type IcrcWalletSupportedStandardsRequestType = z.infer<
  typeof IcrcWalletSupportedStandardsRequest
>;
