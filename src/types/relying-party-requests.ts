import {z} from 'zod';
import {RpcIdSchema} from './rpc';

export const RelyingPartyRequestOptionsTimeoutSchema = z.object({
  /**
   * Specifies the maximum duration in milliseconds for attempting to request an interaction with the relying party.
   * If the relying party does not answer within this duration, the process will time out.
   * Must be a positive number.
   */
  timeoutInMilliseconds: z.number().positive()
});

export const RelyingPartyRequestOptionsSchema = z
  .object({
    /**
     * A custom identifier for the request, used to correlate responses with their corresponding requests.
     *
     * The relying party is expected to include this ID in its response, ensuring that the response can be accurately matched to the original request.
     *
     * If not provided, the library will generate a unique identifier automatically.
     */
    requestId: RpcIdSchema.optional()
  })
  .merge(RelyingPartyRequestOptionsTimeoutSchema.partial());

export type RelyingPartyRequestOptions = z.infer<typeof RelyingPartyRequestOptionsSchema>;

export const RelyingPartyRequestOptionsWithTimeoutSchema = RelyingPartyRequestOptionsSchema.omit({
  timeoutInMilliseconds: true
}).merge(RelyingPartyRequestOptionsTimeoutSchema);

export type RelyingPartyRequestOptionsWithTimeout = z.infer<
  typeof RelyingPartyRequestOptionsWithTimeoutSchema
>;
