import {z} from 'zod';
import {
  ICRC25_PERMISSIONS,
  ICRC25_REQUEST_PERMISSIONS,
  ICRC25_SUPPORTED_STANDARDS,
  ICRC29_STATUS
} from '../constants/icrc.constants';
import {IcrcWalletScopedMethodSchema} from './icrc';
import {inferRpcRequestWithParamsSchema, inferRpcRequestWithoutParamsSchema} from './rpc';

// icrc25_request_permissions
// https://github.com/dfinity/wg-identity-authentication/blob/main/topics/icrc_25_signer_interaction_standard.md#icrc25_request_permissions
const IcrcWalletScopesParamsSchema = z.object({
  scopes: z
    .array(
      z.object({
        method: IcrcWalletScopedMethodSchema
      })
    )
    .min(1)
});

export type IcrcWalletScopesParams = z.infer<typeof IcrcWalletScopesParamsSchema>;

export const IcrcWalletRequestPermissionsRequestSchema = inferRpcRequestWithParamsSchema({
  method: ICRC25_REQUEST_PERMISSIONS,
  params: IcrcWalletScopesParamsSchema
});

export type IcrcWalletRequestPermissionsRequest = z.infer<
  typeof IcrcWalletRequestPermissionsRequestSchema
>;

// icrc25_permissions
// https://github.com/dfinity/wg-identity-authentication/blob/main/topics/icrc_25_signer_interaction_standard.md#icrc25_permissions
export const IcrcWalletPermissionsRequestSchema = inferRpcRequestWithoutParamsSchema({
  method: ICRC25_PERMISSIONS
});

export type IcrcWalletPermissionsRequest = z.infer<typeof IcrcWalletPermissionsRequestSchema>;

// icrc25_supported_standards
// https://github.com/dfinity/wg-identity-authentication/blob/main/topics/icrc_25_signer_interaction_standard.md#icrc25_supported_standards
export const IcrcWalletSupportedStandardsRequestSchema = inferRpcRequestWithoutParamsSchema({
  method: ICRC25_SUPPORTED_STANDARDS
});

export type IcrcWalletSupportedStandardsRequest = z.infer<
  typeof IcrcWalletSupportedStandardsRequestSchema
>;

// icrc29_status
// https://github.com/dfinity/wg-identity-authentication/blob/main/topics/icrc_29_window_post_message_transport.md
export const IcrcWalletStatusRequestSchema = inferRpcRequestWithoutParamsSchema({
  method: ICRC29_STATUS
});

export type IcrcWalletStatusRequest = z.infer<typeof IcrcWalletStatusRequestSchema>;
