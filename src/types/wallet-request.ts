import {z} from 'zod';
import {RpcIdSchema} from './rpc';

export const WalletRequestOptionsSchema = z.object({
  /**
   * A custom identifier for the request, used to correlate responses with their corresponding requests.
   *
   * The wallet is expected to include this ID in its response, ensuring that the response can be accurately matched to the original request.
   *
   * If not provided, the library will generate a unique identifier automatically.
   */
  requestId: RpcIdSchema.optional(),

  /**
   * Specifies the maximum duration in milliseconds for attempting to request an interaction with the wallet.
   * If the wallet does not answer within this duration, the process will time out.
   */
  timeoutInMilliseconds: z.number().optional()
});
export type WalletRequestOptions = z.infer<typeof WalletRequestOptionsSchema>;
