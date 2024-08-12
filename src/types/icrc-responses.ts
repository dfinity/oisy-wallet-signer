import {z} from 'zod';
import {
  IcrcWalletPermissionStateSchema,
  IcrcWalletScopedMethodSchema,
  IcrcWalletStandardSchema
} from './icrc';
import {inferRpcResponseSchema} from './rpc';

const IcrcScopeMethodSchema = z.object({
  method: IcrcWalletScopedMethodSchema
});

const IcrcScopeSchema = z.object({
  scope: IcrcScopeMethodSchema,
  state: IcrcWalletPermissionStateSchema
});

export type IcrcScope = z.infer<typeof IcrcScopeSchema>;

const IcrcScopesSchema = z.object({
  scopes: z.array(IcrcScopeSchema)
});

export type IcrcScopes = z.infer<typeof IcrcScopesSchema>;

// icrc25_request_permissions
// https://github.com/dfinity/wg-identity-authentication/blob/main/topics/icrc_25_signer_interaction_standard.md#icrc25_request_permissions
export const IcrcRequestPermissionsResponseSchema = inferRpcResponseSchema(IcrcScopesSchema);

export type IcrcRequestPermissionsResponse = z.infer<typeof IcrcRequestPermissionsResponseSchema>;

// icrc25_permissions
// https://github.com/dfinity/wg-identity-authentication/blob/main/topics/icrc_25_signer_interaction_standard.md#icrc25_permissions
export const IcrcPermissionsResponseSchema = IcrcRequestPermissionsResponseSchema;

export type IcrcPermissionsResponse = z.infer<typeof IcrcPermissionsResponseSchema>;

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

const IcrcSupportedStandardsSchema = z
  .array(
    z.object({
      name: IcrcWalletStandardSchema,
      url: UrlSchema
    })
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
