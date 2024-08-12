import {z} from 'zod';
import {IcrcScopeSchema} from './icrc-responses';
import {RpcIdSchema} from './rpc';

export const RequestPermissionPayloadSchema = z.object({
  requestId: RpcIdSchema,
  scopes: z.array(IcrcScopeSchema)
});

export type RequestPermissionPayload = z.infer<typeof RequestPermissionPayloadSchema>;
