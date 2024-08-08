import {z} from 'zod';

// JSON-RPC 2.0 Specification
// https://www.jsonrpc.org/specification

export const JSON_RPC_VERSION_2 = '2.0';

const JsonRpcSchema = z.literal(JSON_RPC_VERSION_2);

export const RpcIdSchema = z.union([z.string(), z.number(), z.null()]);

export type RpcId = z.infer<typeof RpcIdSchema>;

const RpcSchema = z.object({
  jsonrpc: JsonRpcSchema,
  id: z.optional(RpcIdSchema)
});

export const RpcRequestSchema = RpcSchema.extend({
  id: RpcIdSchema
})
  .merge(
    z.object({
      method: z.string(),
      params: z.optional(z.any())
    })
  )
  .strict();

type _RpcRequest = z.infer<typeof RpcRequestSchema>;

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export const inferRpcRequestWithoutParamsSchema = <M extends string>({method}: {method: M}) =>
  RpcRequestSchema.omit({method: true, params: true})
    .strict()
    .extend({
      id: RpcIdSchema,
      method: z.literal(method)
    });

type RpcRequestWithoutParamsReturnType<M extends string> = ReturnType<
  typeof inferRpcRequestWithoutParamsSchema<M>
>;

type _RpcRequestWithoutParams<M extends string> = z.infer<RpcRequestWithoutParamsReturnType<M>>;

/* eslint-disable @typescript-eslint/explicit-function-return-type */
export const inferRpcRequestWithParamsSchema = <T extends z.ZodTypeAny, M extends string>({
  params,
  method
}: {
  params: T;
  method: M;
}) =>
  RpcRequestSchema.omit({method: true})
    .extend({
      id: RpcIdSchema,
      method: z.literal(method)
    })
    .merge(
      z.object({
        params
      })
    );
/* eslint-enable */

export const RpcNotificationSchema = RpcRequestSchema.omit({id: true}).strict();

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

const RpcResponseErrorSchema = z.object({
  code: z.union([z.number(), z.nativeEnum(RpcErrorCode)]),
  message: z.string(),
  data: z.optional(z.never())
});

export type RpcResponseError = z.infer<typeof RpcResponseErrorSchema>;

const RpcResponseSchema = RpcSchema.extend({
  id: RpcIdSchema
});

export type RpcResponse = z.infer<typeof RpcResponseSchema>;

const RpcResponseWithErrorSchema = RpcResponseSchema.extend({
  error: RpcResponseErrorSchema
});

export type RpcResponseWithError = z.infer<typeof RpcResponseWithErrorSchema>;

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export const inferRpcResponseSchema = <T extends z.ZodTypeAny>(result: T) =>
  RpcResponseWithErrorSchema.omit({error: true})
    .merge(
      z
        .object({
          result,
          error: RpcResponseErrorSchema
        })
        .partial()
    )
    .strict()
    .refine(
      ({result, error}) => result !== undefined || error !== undefined,
      'Either result or error should be provided.'
    );

export const RpcResponseWithResultOrErrorSchema = inferRpcResponseSchema(z.any());
