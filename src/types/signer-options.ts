import {Principal} from '@dfinity/principal';
import {z} from 'zod';

const PrincipalSchema = z.custom<Principal>((principal) => {

  console.log(principal, principal instanceof Principal)

  if (!(principal instanceof Principal)) {
    throw new Error('The value provided is not a valid Principal.');
  }
  if (principal.isAnonymous()) {
    throw new Error('The Principal is anonymous and cannot be used.');
  }

  return true;
});

export const SignerOptionsSchema = z.object({
  /**
   * The owner who interacts with the signer.
   *
   * When the signer is initialized, the owner should be signed in to the consumer dApp.
   * Upon signing out, it is up to the consumer to disconnect the signer.
   */
  owner: PrincipalSchema
});

export type SignerOptions = z.infer<typeof SignerOptionsSchema>;
