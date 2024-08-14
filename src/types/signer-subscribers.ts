import {z} from 'zod';
import {IcrcScopesArraySchema} from './icrc-responses';
import {RpcIdSchema} from './rpc';

export const RequestPermissionPayloadSchema = z.object({
  requestId: RpcIdSchema,
  scopes: IcrcScopesArraySchema
});

export type RequestPermissionPayload = z.infer<typeof RequestPermissionPayloadSchema>;
