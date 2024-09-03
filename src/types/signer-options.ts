import {HttpAgent, ProxyAgent, type Agent} from '@dfinity/agent';
import {Principal} from '@dfinity/principal';
import {z} from 'zod';

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

export const SignerOptionsSchema = z.object({
  /**
   * The owner who interacts with the signer.
   *
   * When the signer is initialized, the owner should be signed in to the consumer dApp.
   * Upon signing out, it is up to the consumer to disconnect the signer.
   */
  owner: PrincipalNotAnonymousSchema,

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
