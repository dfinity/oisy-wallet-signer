import {z} from 'zod';

// JSON-RPC 2.0 Specification
// https://www.jsonrpc.org/specification

export const JSON_RPC_VERSION_2 = '2.0';

const JsonRpc = z.literal(JSON_RPC_VERSION_2);

const RpcId = z.union([z.string(), z.number(), z.null()]);

const Rpc = z.object({
  jsonrpc: JsonRpc,
  id: z.optional(RpcId)
});

const RpcRequest = Rpc.merge(
  z.object({
    method: z.string(),
    params: z.optional(z.any())
  })
);

type RpcRequestType = z.infer<typeof RpcRequest>;

export const inferRpcRequest = <T extends z.ZodTypeAny>(params: T): z.ZodType<RpcRequestType> =>
  RpcRequest.extend({
    id: RpcId
  }).merge(
    z.object({
      params
    })
  );

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

const RpcResponse = Rpc.extend({
  id: RpcId
});

type RpcResponseType = z.infer<typeof RpcResponse>;

const RpcResponseContent = z
  .object({
    result: z.any(),
    error: RpcResponseError
  })
  .partial();

type RpcResponseContentType = z.infer<typeof RpcResponseContent>;

export const inferRpcResponse = <T extends z.ZodTypeAny>(
  result: T
): z.ZodType<RpcResponseType & RpcResponseContentType> =>
  RpcResponse.merge(
    z
      .object({
        result,
        error: RpcResponseError
      })
      .partial()
  ).refine(
    ({result, error}) => result !== undefined || error !== undefined,
    'Either result or error should be provided.'
  );
