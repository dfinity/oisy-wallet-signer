import {Type} from '@dfinity/candid/lib/cjs/idl';
import {z} from 'zod';
import {IcrcCallCanisterRequestParamsSchema} from './icrc-requests';
import {RpcIdSchema} from './rpc';

export const WalletRequestOptionsTimeoutSchema = z.object({
  /**
   * Specifies the maximum duration in milliseconds for attempting to request an interaction with the wallet.
   * If the wallet does not answer within this duration, the process will time out.
   */
  timeoutInMilliseconds: z.number()
});

export const WalletRequestOptionsSchema = z
  .object({
    /**
     * A custom identifier for the request, used to correlate responses with their corresponding requests.
     *
     * The wallet is expected to include this ID in its response, ensuring that the response can be accurately matched to the original request.
     *
     * If not provided, the library will generate a unique identifier automatically.
     */
    requestId: RpcIdSchema.optional()
  })
  .merge(WalletRequestOptionsTimeoutSchema.partial());

export type WalletRequestOptions = z.infer<typeof WalletRequestOptionsSchema>;

export const WalletRequestOptionsWithTimeoutSchema = WalletRequestOptionsSchema.omit({
  timeoutInMilliseconds: true
}).merge(WalletRequestOptionsTimeoutSchema);

export type WalletRequestOptionsWithTimeout = z.infer<typeof WalletRequestOptionsWithTimeoutSchema>;

/* eslint-disable @typescript-eslint/explicit-function-return-type */
const extendIcrcCallCanisterRequestParamsSchema = <T>() => {
  return IcrcCallCanisterRequestParamsSchema.omit({arg: true}).extend({
    arg: z.custom<T>(),
    argType: z.instanceof(Type) as z.ZodType<Type>
  });
};

export type WalletCallParams<T> = z.infer<
  ReturnType<typeof extendIcrcCallCanisterRequestParamsSchema<T>>
>;
