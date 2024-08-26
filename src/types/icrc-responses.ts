import {z} from 'zod';
import {IcrcAccountsSchema} from './icrc-accounts';
import {
  IcrcWalletPermissionStateSchema,
  IcrcWalletScopedMethodSchema,
  IcrcWalletStandardSchema
} from './icrc-standards';
import {inferRpcResponseSchema} from './rpc';

const IcrcScopeMethodSchema = z.object({
  method: IcrcWalletScopedMethodSchema
});

export const IcrcScopeSchema = z
  .object({
    scope: IcrcScopeMethodSchema,
    state: IcrcWalletPermissionStateSchema
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

const UrlSchema = z
  .string()
  .url()
  .regex(urlRegex)
  .refine(
    (url) => {
      const match = /(ICRC-\d+)\.md/g.exec(url);

      if (match === null) {
        return;
      }

      const [_, icrc] = match;

      return Object.keys(IcrcWalletStandardSchema.Values).includes(icrc);
    },
    {
      message: 'The URL does not match any of the IcrcWalletStandard values.'
    }
  );

export const IcrcSupportedStandardsSchema = z
  .array(
    z
      .object({
        name: IcrcWalletStandardSchema,
        url: UrlSchema
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
