import {z} from 'zod';
import {IcrcScopeSchema} from './icrc-responses';

export const SessionTimestampsSchema = z.object({
  createdAt: z.number().positive(),
  updatedAt: z.number().positive()
});

export const SessionIcrcScopeSchema = IcrcScopeSchema.merge(SessionTimestampsSchema);

export type SessionIcrcScope = z.infer<typeof SessionIcrcScopeSchema>;

export const SessionPermissionsSchema = z
  .object({
    scopes: z.array(SessionIcrcScopeSchema)
  })
  .merge(SessionTimestampsSchema);

export type SessionPermissions = z.infer<typeof SessionPermissionsSchema>;
