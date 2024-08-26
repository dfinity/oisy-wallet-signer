import {z} from 'zod';
import {
  ICRC25_PERMISSIONS,
  ICRC25_REQUEST_PERMISSIONS,
  ICRC25_SUPPORTED_STANDARDS,
  ICRC27_ACCOUNTS,
  ICRC29_STATUS
} from '../constants/icrc.constants';
import {IcrcWalletScopedMethodSchema} from './icrc-standards';
import {inferRpcRequestWithParamsSchema, inferRpcRequestWithoutParamsSchema} from './rpc';

// icrc25_request_permissions
// https://github.com/dfinity/wg-identity-authentication/blob/main/topics/icrc_25_signer_interaction_standard.md#icrc25_request_permissions
const IcrcRequestedScopesSchema = z.object({
  scopes: z
    .array(
      z.object({
        method: IcrcWalletScopedMethodSchema
      })
    )
    .min(1)
});

export type IcrcRequestedScopes = z.infer<typeof IcrcRequestedScopesSchema>;

const IcrcAnyRequestedScopesSchema = z.object({
  scopes: z
    .array(
      z.object({
        // According to the specification, the relying party can request permissions for random, unspecified methods, and these should "just" be ignored by the wallet.
        method: z.string()
      })
    )
    .min(1)
});

export type IcrcAnyRequestedScopes = z.infer<typeof IcrcAnyRequestedScopesSchema>;

export const IcrcRequestAnyPermissionsRequestSchema = inferRpcRequestWithParamsSchema({
  method: ICRC25_REQUEST_PERMISSIONS,
  params: IcrcAnyRequestedScopesSchema
});

export type IcrcRequestAnyPermissionsRequest = z.infer<
  typeof IcrcRequestAnyPermissionsRequestSchema
>;

// icrc25_permissions
// https://github.com/dfinity/wg-identity-authentication/blob/main/topics/icrc_25_signer_interaction_standard.md#icrc25_permissions
export const IcrcPermissionsRequestSchema = inferRpcRequestWithoutParamsSchema({
  method: ICRC25_PERMISSIONS
});

export type IcrcPermissionsRequest = z.infer<typeof IcrcPermissionsRequestSchema>;

// icrc25_supported_standards
// https://github.com/dfinity/wg-identity-authentication/blob/main/topics/icrc_25_signer_interaction_standard.md#icrc25_supported_standards
export const IcrcSupportedStandardsRequestSchema = inferRpcRequestWithoutParamsSchema({
  method: ICRC25_SUPPORTED_STANDARDS
});

export type IcrcSupportedStandardsRequest = z.infer<typeof IcrcSupportedStandardsRequestSchema>;

// icrc29_status
// https://github.com/dfinity/wg-identity-authentication/blob/main/topics/icrc_29_window_post_message_transport.md
export const IcrcStatusRequestSchema = inferRpcRequestWithoutParamsSchema({
  method: ICRC29_STATUS
});

export type IcrcStatusRequest = z.infer<typeof IcrcStatusRequestSchema>;

// icrc27_accounts
// https://github.com/dfinity/wg-identity-authentication/blob/main/topics/icrc_27_accounts.md
export const IcrcAccountsRequestSchema = inferRpcRequestWithoutParamsSchema({
  method: ICRC27_ACCOUNTS
});

export type IcrcAccountsRequest = z.infer<typeof IcrcAccountsRequestSchema>;
