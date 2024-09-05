import {type Identity} from '@dfinity/agent';
import {isNullish} from '@dfinity/utils';
import {z} from 'zod';

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
  } catch (err: unknown) {
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

export const SignerHostSchema = z.string().url().optional();

export type SignerHost = z.infer<typeof SignerHostSchema>;

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
  host: SignerHostSchema
});

export type SignerOptions = z.infer<typeof SignerOptionsSchema>;
