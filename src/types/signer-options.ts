import {HttpAgent, ProxyAgent, type Agent, type Identity} from '@dfinity/agent';
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

export const SignerOptionsSchema = z.object({
  /**
   * The owner who interacts with the signer.
   *
   * When the signer is initialized, the owner should be signed in to the consumer dApp.
   * Upon signing out, it is up to the consumer to disconnect the signer.
   */
  owner: IdentityNotAnonymousSchema,

  // TODO: instead of an agent, should the consumer only pas a "DEV" mode?
  // The library can take care of creating the Anonymous agent for consent message, at least for now.

  /**
   * An agent that the signer can use to fetch the consent message during a canister call.
   *
   * This should be an instance of either `HttpAgent` or `ProxyAgent`.
   */
  agent: z.custom<Agent>((agent) => agent instanceof ProxyAgent || agent instanceof HttpAgent, {
    message: 'Invalid agent instance.'
  })
});

export type SignerOptions = z.infer<typeof SignerOptionsSchema>;
