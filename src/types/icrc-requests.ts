import {base64ToUint8Array, isNullish} from '@dfinity/utils';
import {PrincipalTextSchema} from '@dfinity/zod-schemas';
import * as z from 'zod';
import {
  ICRC25_PERMISSIONS,
  ICRC25_REQUEST_PERMISSIONS,
  ICRC25_SUPPORTED_STANDARDS,
  ICRC27_ACCOUNTS,
  ICRC29_STATUS,
  ICRC49_CALL_CANISTER
} from '../constants/icrc.constants';
import {IcrcBlobSchema} from './blob';
import {IcrcScopedMethodSchema} from './icrc-standards';
import {inferRpcRequestWithParamsSchema, inferRpcRequestWithoutParamsSchema} from './rpc';

// icrc25_request_permissions
// https://github.com/dfinity/wg-identity-authentication/blob/main/topics/icrc_25_signer_interaction_standard.md#icrc25_request_permissions
const IcrcRequestedScopesSchema = z.object({
  scopes: z
    .array(
      z.object({
        method: IcrcScopedMethodSchema
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

// icrc49_call_canister
// https://github.com/dfinity/wg-identity-authentication/blob/main/topics/icrc_49_call_canister.md

const MethodSchema = z.string().trim().min(1);

export type Method = z.infer<typeof MethodSchema>;

export const IcrcCallCanisterRequestParamsSchema = z.object({
  canisterId: PrincipalTextSchema,
  sender: PrincipalTextSchema,
  method: MethodSchema,
  arg: IcrcBlobSchema,
  nonce: IcrcBlobSchema.optional().refine(
    (blob) => {
      try {
        return isNullish(blob) || base64ToUint8Array(blob).length <= 32;
      } catch (_err: unknown) {
        return false;
      }
    },
    {
      message: 'Nonce must be a Uint8Array with a maximum length of 32 bytes'
    }
  )
});

export type IcrcCallCanisterRequestParams = z.infer<typeof IcrcCallCanisterRequestParamsSchema>;

export const IcrcCallCanisterRequestSchema = inferRpcRequestWithParamsSchema({
  method: ICRC49_CALL_CANISTER,
  params: IcrcCallCanisterRequestParamsSchema
});

export type IcrcCallCanisterRequest = z.infer<typeof IcrcCallCanisterRequestSchema>;
