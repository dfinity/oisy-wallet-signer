import {type Identity} from '@dfinity/agent';
import {isNullish} from '@dfinity/utils';
import {UrlSchema} from '@dfinity/zod-schemas';
import * as z from 'zod';

const IdentitySchema = z.custom<Identity>((value: unknown): boolean => {
  if (isNullish(value)) {
    return false;
  }

  if (typeof value !== 'object') {
    return false;
  }

  try {
    (value as Identity).getPrincipal();
    return true;
  } catch (_err: unknown) {
    return false;
  }
}, 'The value provided is not a valid Identity.');

const IdentityNotAnonymousSchema = IdentitySchema.refine(
  (identity) => !identity.getPrincipal().isAnonymous(),
  {
    message: 'The Principal is anonymous and cannot be used.'
  }
);

export type IdentityNotAnonymous = z.infer<typeof IdentityNotAnonymousSchema>;

export const SignerHostSchema = UrlSchema.optional();

export type SignerHost = z.infer<typeof SignerHostSchema>;

const SessionOptionsSchema = z.object({
  /**
   * Specifies the duration in milliseconds for which the session permissions are valid.
   * After this period, the user is requested to approve or deny permissions again.
   * Must be a positive number.
   *
   * @default 7 days (7 * 24 * 60 * 60 * 1000 = 604800000 milliseconds)
   *
   */
  sessionPermissionExpirationInMilliseconds: z.number().positive().optional()
});

export const SignerOptionsSchema = z.object({
  /**
   * The owner who interacts with the signer.
   *
   * When the signer is initialized, the owner should be signed in to the consumer dApp.
   * Upon signing out, it is up to the consumer to disconnect the signer.
   */
  owner: IdentityNotAnonymousSchema,

  /**
   * The replica's host to which the signer should connect to.
   * If localhost or 127.0.0.1 are provided, the signer will automatically connect to a local replica and fetch the root key for the agent.
   */
  host: SignerHostSchema,

  /**
   * Options for managing session behavior, including session expiration times.
   */
  sessionOptions: SessionOptionsSchema.optional()
});

export type SignerOptions = z.infer<typeof SignerOptionsSchema>;
