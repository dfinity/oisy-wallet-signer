import {z} from 'zod';

// JSON-RPC 2.0 Specification
// https://www.jsonrpc.org/specification

export const JSON_RPC_VERSION_2 = '2.0';

const JsonRpc = z.literal(JSON_RPC_VERSION_2);

const RpcId = z.union([z.string(), z.number(), z.null()]);

export type RpcIdType = z.infer<typeof RpcId>;

const Rpc = z.object({
  jsonrpc: JsonRpc,
  id: z.optional(RpcId)
});

export const RpcRequest = Rpc.extend({
  id: RpcId
})
  .merge(
    z.object({
      method: z.string(),
      params: z.optional(z.any())
    })
  )
  .strict();

type _RpcRequestType = z.infer<typeof RpcRequest>;

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export const inferRpcRequestWithoutParams = <M extends string>({method}: {method: M}) =>
  RpcRequest.omit({method: true, params: true})
    .strict()
    .extend({
      id: RpcId,
      method: z.literal(method)
    });

type RpcRequestWithoutParamsReturnType<M extends string> = ReturnType<
  typeof inferRpcRequestWithoutParams<M>
>;

type _RpcRequestWithoutParamsType<M extends string> = z.infer<RpcRequestWithoutParamsReturnType<M>>;

/* eslint-disable @typescript-eslint/explicit-function-return-type */
export const inferRpcRequestWithParams = <T extends z.ZodTypeAny, M extends string>({
  params,
  method
}: {
  params: T;
  method: M;
}) =>
  RpcRequest.omit({method: true})
    .extend({
      id: RpcId,
      method: z.literal(method)
    })
    .merge(
      z.object({
        params
      })
    );
/* eslint-enable */

export const RpcNotification = RpcRequest.omit({id: true}).strict();

export enum RpcErrorCode {
  /**
   * Invalid JSON was received by the server.
   * An error occurred on the server while parsing the JSON text.
   */
  PARSE_ERROR = -32700,
  /**
   * The JSON sent is not a valid Request object.
   */
  INVALID_REQUEST = -32600,
  /**
   * The method does not exist / is not available.
   */
  METHOD_NOT_FOUND = -32601,
  /**
   * Invalid method parameter(s).
   */
  INVALID_PARAMS = -32602,
  /**
   * Internal JSON-RPC error.
   */
  INTERNAL_ERROR = -32603,
  /**
   * Reserved for implementation-defined server-errors.
   */
  SERVER_ERROR = -32000
}

const RpcResponseError = z.object({
  code: z.union([z.number(), z.nativeEnum(RpcErrorCode)]),
  message: z.string(),
  data: z.optional(z.never())
});

export type RpcResponseErrorType = z.infer<typeof RpcResponseError>;

const RpcResponse = Rpc.extend({
  id: RpcId
});

export type RpcResponseType = z.infer<typeof RpcResponse>;

const RpcResponseContent = <T extends z.ZodTypeAny>(
  result: T
): z.ZodObject<{
  result: z.ZodOptional<T>;
  error: z.ZodOptional<typeof RpcResponseError>;
}> =>
  z
    .object({
      result,
      error: RpcResponseError
    })
    .partial();

// TODO: Maybe we can use this type in inferRpcResponse?
type _RpcResponseContentType<T extends z.ZodTypeAny> = z.infer<
  ReturnType<typeof RpcResponseContent<T>>
>;

const RpcResponseWithError = RpcResponse.extend({
  error: RpcResponseError
});

export type RpcResponseWithErrorType = z.infer<typeof RpcResponseWithError>;

// TODO: Simplify the return type to avoid redundancy with other types. Consider using a more concise or existing type definition.
export const inferRpcResponse = <T extends z.ZodTypeAny>(
  result: T
): z.ZodEffects<
  z.ZodObject<
    {
      jsonrpc: z.ZodLiteral<'2.0'>;
      id: z.ZodUnion<[z.ZodString, z.ZodNumber, z.ZodNull]>;
      result: z.ZodOptional<T>;
      error: z.ZodOptional<
        z.ZodObject<{
          code: z.ZodUnion<[z.ZodNumber, z.ZodNativeEnum<typeof RpcErrorCode>]>;
          message: z.ZodString;
          data: z.ZodOptional<z.ZodNever>;
        }>
      >;
    },
    'strict'
  >
> =>
  RpcResponseWithError.omit({error: true})
    .merge(
      z
        .object({
          result,
          error: RpcResponseError
        })
        .partial()
    )
    .strict()
    .refine(
      ({result, error}) => result !== undefined || error !== undefined,
      'Either result or error should be provided.'
    );

export const RpcResponseWithResultOrError = inferRpcResponse(z.any());
