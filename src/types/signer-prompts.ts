import {z} from 'zod';
import {IcrcScopesArraySchema} from './icrc-responses';

const PermissionsConfirmationSchema = z.function().args(IcrcScopesArraySchema).returns(z.void());

export type PermissionsConfirmation = z.infer<typeof PermissionsConfirmationSchema>;

const PermissionsPromptPayloadSchema = z.object({
  requestedScopes: IcrcScopesArraySchema,
  confirmScopes: PermissionsConfirmationSchema
});

export type PermissionsPromptPayload = z.infer<typeof PermissionsPromptPayloadSchema>;

/**
 * A function that is invoked when the signer requires the user to confirm (grant or deny) requested permissions.
 *
 * This function may be triggered in two scenarios:
 * 1. When the relying party explicitly requests permissions.
 * 2. When the relying party attempts to access a feature that requires permissions that have not yet been granted by the user.
 *
 * @param {PermissionsPromptPayload} params - An object containing the requested permissions and a function to confirm them.
 * @param {IcrcScopes[]} params.requestedScopes - An array of IcrcScopes representing the permissions being requested.
 * @param {PermissionsConfirmation} params.confirmScopes - A function to be called by the consumer to confirm (grant or deny) the requested permissions.
 */
const PermissionsPromptSchema = z.function().args(PermissionsPromptPayloadSchema).returns(z.void());

export type PermissionsPrompt = z.infer<typeof PermissionsPromptSchema>;
