import {z} from 'zod';
import {IcrcWalletPermissionState, IcrcWalletRequestMethod, IcrcWalletStandard} from './icrc';
import {inferRpcResponse} from './rpc';

const IcrcWalletScopesResult = z.object({
  scopes: z.array(
    z.object({
      scope: z.object({
        method: IcrcWalletRequestMethod
      }),
      state: IcrcWalletPermissionState
    })
  )
});

// icrc25_request_permissions
// https://github.com/dfinity/wg-identity-authentication/blob/main/topics/icrc_25_signer_interaction_standard.md#icrc25_request_permissions
export const IcrcWalletRequestPermissionsResponse = inferRpcResponse(IcrcWalletScopesResult);

// icrc25_permissions
// https://github.com/dfinity/wg-identity-authentication/blob/main/topics/icrc_25_signer_interaction_standard.md#icrc25_permissions
export const IcrcWalletPermissionsResponse = IcrcWalletRequestPermissionsResponse;

// icrc25_supported_standards
// https://github.com/dfinity/wg-identity-authentication/blob/main/topics/icrc_25_signer_interaction_standard.md#icrc25_supported_standards
const urlRegex =
  /^https:\/\/github\.com\/dfinity\/ICRC\/blob\/main\/ICRCs\/ICRC-\d+\/ICRC-\d+\.md$/;

const urlSchema = z
  .string()
  .url()
  .regex(urlRegex)
  .refine(
    (url) => {
      const match = url.match(/ICRCs\/(ICRC-\d+)\.md$/);

      if (match === null) {
        return;
      }

      const [_, icrc] = match;
      return Object.values(IcrcWalletStandard).includes(icrc);
    },
    {
      message: 'The URL does not match any of the IcrcWalletStandard values.'
    }
  );

export const IcrcSupportedStandardsResponse = inferRpcResponse(
  z.object({
    supportedStandards: z.array(
      z.object({
        name: IcrcWalletStandard,
        url: urlSchema
      })
    )
  })
);
