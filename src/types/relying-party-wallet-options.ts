import {z} from 'zod';
import {RelyingPartyOptionsSchema} from './relying-party-options';
import {UrlSchema} from './url';

const RelyingPartyWalletHostSchema = UrlSchema.optional();

export type RelyingPartyWalletHost = z.infer<typeof RelyingPartyWalletHostSchema>;

export const RelyingPartyWalletOptionsSchema = RelyingPartyOptionsSchema.extend({
  /**
   * The host of the replica to which the relying party wallet might be connected.
   * This is useful for local development if your local replica runs on a port other than the default, as an agent must be created to decode the response.
   * If "localhost" or "127.0.0.1" is provided, it will automatically connect to a local replica and fetch the root key for the agent.
   */
  host: RelyingPartyWalletHostSchema
});

export type RelyingPartyWalletOptions = z.infer<typeof RelyingPartyWalletOptionsSchema>;
