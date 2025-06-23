import {UrlSchema} from '@dfinity/zod-schemas';
import * as z from "zod/v4";
import {IcrcBlobSchema} from './blob';
import {IcrcAccountsSchema} from './icrc-accounts';
import {
  IcrcPermissionStateSchema,
  IcrcScopedMethodSchema,
  IcrcStandardSchema
} from './icrc-standards';
import {inferRpcResponseSchema} from './rpc';

const IcrcScopeMethodSchema = z.object({
  method: IcrcScopedMethodSchema
});

export type IcrcScopeMethod = z.infer<typeof IcrcScopeMethodSchema>;

export const IcrcScopeSchema = z
  .object({
    scope: IcrcScopeMethodSchema,
    state: IcrcPermissionStateSchema
  })
  .strict();

export type IcrcScope = z.infer<typeof IcrcScopeSchema>;

export const IcrcScopesArraySchema = z.array(IcrcScopeSchema);

export type IcrcScopesArray = z.infer<typeof IcrcScopesArraySchema>;

export const IcrcScopesSchema = z
  .object({
    scopes: IcrcScopesArraySchema
  })
  .strict();

export type IcrcScopes = z.infer<typeof IcrcScopesSchema>;

// icrc25_request_permissions and icrc25_permissions
// https://github.com/dfinity/wg-identity-authentication/blob/main/topics/icrc_25_signer_interaction_standard.md#icrc25_request_permissions
// https://github.com/dfinity/wg-identity-authentication/blob/main/topics/icrc_25_signer_interaction_standard.md#icrc25_permissions
export const IcrcScopesResponseSchema = inferRpcResponseSchema(IcrcScopesSchema);

export type IcrcScopesResponse = z.infer<typeof IcrcScopesResponseSchema>;

// icrc25_supported_standards
// https://github.com/dfinity/wg-identity-authentication/blob/main/topics/icrc_25_signer_interaction_standard.md#icrc25_supported_standards
const urlRegex =
  /^https:\/\/github\.com\/dfinity\/ICRC\/blob\/main\/ICRCs\/ICRC-\d+\/ICRC-\d+\.md$/;

const SupportedStandardsUrlSchema = z
  .string()
  .url()
  .regex(urlRegex)
  .refine(
    (url) => {
      try {
        UrlSchema.parse(url);
      } catch (_err: unknown) {
        return false;
      }

      const match = /(ICRC-\d+)\.md/g.exec(url);

      if (match === null) {
        return false;
      }

      const [_, icrc] = match;

      return Object.keys(IcrcStandardSchema.enum).includes(icrc);
    },
    {
      message: 'The URL does not match any of the IcrcStandard values.'
    }
  );

export const IcrcSupportedStandardsSchema = z
  .array(
    z
      .object({
        name: IcrcStandardSchema,
        url: SupportedStandardsUrlSchema
      })
      .strict()
  )
  .min(1);

export type IcrcSupportedStandards = z.infer<typeof IcrcSupportedStandardsSchema>;

export const IcrcSupportedStandardsResponseSchema = inferRpcResponseSchema(
  z.object({
    supportedStandards: IcrcSupportedStandardsSchema
  })
);

export type IcrcSupportedStandardsResponse = z.infer<typeof IcrcSupportedStandardsResponseSchema>;

// icrc29_status
// https://github.com/dfinity/wg-identity-authentication/blob/main/topics/icrc_29_window_post_message_transport.md

export const IcrcReadyResponseSchema = inferRpcResponseSchema(z.literal('ready'));

export type IcrcReadyResponse = z.infer<typeof IcrcReadyResponseSchema>;

// icrc27_accounts
// https://github.com/dfinity/wg-identity-authentication/blob/main/topics/icrc_27_accounts.md#icrc-27-get-accounts

export const IcrcAccountsResponseSchema = inferRpcResponseSchema(
  z.object({
    accounts: IcrcAccountsSchema
  })
);

export type IcrcAccountsResponse = z.infer<typeof IcrcAccountsResponseSchema>;

// icrc49_call_canister
// https://github.com/dfinity/wg-identity-authentication/blob/main/topics/icrc_49_call_canister.md

export const IcrcCallCanisterResultSchema = z
  .object({
    contentMap: IcrcBlobSchema,
    certificate: IcrcBlobSchema
  })
  .strict();

export type IcrcCallCanisterResult = z.infer<typeof IcrcCallCanisterResultSchema>;

export const IcrcCallCanisterResponseSchema = inferRpcResponseSchema(
  IcrcCallCanisterResultSchema.strict()
);

export type IcrcCallCanisterResponse = z.infer<typeof IcrcCallCanisterResponseSchema>;
