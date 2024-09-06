import {Type} from '@dfinity/candid/lib/cjs/idl';
import {nonNullish} from '@dfinity/utils';
import {z} from 'zod';
import {IcrcCallCanisterRequestParamsSchema} from './icrc-requests';
import {RpcIdSchema} from './rpc';

export const RelyingPartyRequestOptionsTimeoutSchema = z.object({
  /**
   * Specifies the maximum duration in milliseconds for attempting to request an interaction with the relying party.
   * If the relying party does not answer within this duration, the process will time out.
   */
  timeoutInMilliseconds: z.number()
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
export const extendIcrcCallCanisterRequestParamsSchema = <T>() =>
  IcrcCallCanisterRequestParamsSchema.omit({arg: true}).extend({
    arg: z.custom<T>().refine(nonNullish, {
      message: 'arg is required'
    }),
    argType: z.instanceof(Type) as z.ZodType<Type>
  });

/**
 * Represents the type of parameters used in a relying party call, based on the
 * extended ICRC call canister request schema.
 *
 * This type is inferred from the return type of `extendIcrcCallCanisterRequestParamsSchema<T>`,
 * meaning it includes all fields of `IcrcCallCanisterRequestParamsSchema` with a generic `arg` type.
 *
 * @template T - The type of the `arg` field in the schema.
 */
export type RelyingPartyCallParams<T> = z.infer<
  ReturnType<typeof extendIcrcCallCanisterRequestParamsSchema<T>>
>;
