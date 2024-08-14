import {z} from 'zod';
import {IcrcScopesArraySchema} from './icrc-responses';

export const SessionPermissionsSchema = z.object({
  scopes: IcrcScopesArraySchema,
  createdAt: z.number()
});

export type SessionPermissions = z.infer<typeof SessionPermissionsSchema>;
