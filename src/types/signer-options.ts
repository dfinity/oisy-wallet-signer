import {Principal} from '@dfinity/principal';
import {z} from 'zod';
import {IcrcScopesArraySchema} from './icrc-responses';

const PrincipalSchema = z.custom<Principal>((value: unknown) => {
  if (typeof value !== 'object') {
    return false;
  }

  const {_isPrincipal} = value as unknown as {_isPrincipal: boolean | undefined};

  if (_isPrincipal !== true) {
    return false;
  }

  const {_arr} = value as unknown as {_arr: Uint8Array | undefined};
  if (_arr === undefined) {
    return false;
  }

  try {
    Principal.fromUint8Array(_arr);
    return true;
  } catch (err: unknown) {
    return false;
  }
}, 'The value provided is not a valid Principal.');

const PrincipalNotAnonymousSchema = PrincipalSchema.refine(
  (principal: Principal): boolean => {
    return !principal.isAnonymous();
  },
  {
    message: 'The Principal is anonymous and cannot be used.'
  }
);

const PermissionsResponseSchema = z.function().args(IcrcScopesArraySchema).returns(z.void());

export type PermissionsResponse = z.infer<typeof PermissionsResponseSchema>;

const PermissionsRequestsParamsSchema = z.object({
  requestedScopes: IcrcScopesArraySchema,
  confirmScopes: PermissionsResponseSchema
});

export type PermissionsRequestsParams = z.infer<typeof PermissionsRequestsParamsSchema>;

const PermissionsRequestsSchema = z.function().args(PermissionsRequestsParamsSchema).returns(z.void());

export type PermissionsRequests = z.infer<typeof PermissionsRequestsSchema>;

export const SignerOptionsSchema = z.object({
  /**
   * The owner who interacts with the signer.
   *
   * When the signer is initialized, the owner should be signed in to the consumer dApp.
   * Upon signing out, it is up to the consumer to disconnect the signer.
   */
  owner: PrincipalNotAnonymousSchema,

  /**
   * A function invoked when the signer requires the user to confirm (grant or deny) requested permissions.
   *
   * This function can be triggered in two scenarios:
   * 1. When the relying party explicitly requests permissions.
   * 2. When the relying party attempts to access a feature that requires permissions that have not yet been granted by the user.
   *
   * @param requestedScopes - An object containing the `requestedScopes` array of IcrcScopes representing the permissions being requested and the `confirmScopes` function to confirm these permissions.
   */
  permissionsRequests: PermissionsRequestsSchema
});

export type SignerOptions = z.infer<typeof SignerOptionsSchema>;
