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

/**
 * Creates an extended schema for ICRC call canister request parameters.
 *
 * This function generates a schema that extends the base `IcrcCallCanisterRequestParamsSchema`
 * by replacing the `arg` field with a custom type `T` and adding an `argType` field that must be
 * an instance of the `Type` class from `@dfinity/candid`.
 *
 * @template T - The type of the `arg` field.
 * @returns {z.ZodObject} - A Zod schema object that includes the base fields and the custom `arg` and `argType`.
 */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
const extendIcrcCallCanisterRequestParamsSchema = <T>() => {
  return IcrcCallCanisterRequestParamsSchema.omit({arg: true}).extend({
    arg: z.custom<T>(),
    argType: z.instanceof(Type) as z.ZodType<Type>
  });
};

/**
 * Represents the type of parameters used in a wallet call, based on the
 * extended ICRC call canister request schema.
 *
 * This type is inferred from the return type of `extendIcrcCallCanisterRequestParamsSchema<T>`,
 * meaning it includes all fields of `IcrcCallCanisterRequestParamsSchema` with a generic `arg` type.
 *
 * @template T - The type of the `arg` field in the schema.
 */
export type WalletCallParams<T> = z.infer<
  ReturnType<typeof extendIcrcCallCanisterRequestParamsSchema<T>>
>;
