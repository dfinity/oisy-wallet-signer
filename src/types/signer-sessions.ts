import {z} from 'zod';
import {IcrcScopesArraySchema} from './icrc-responses';

export const SessionPermissionsSchema = z.object({
  scopes: IcrcScopesArraySchema,
  created_at: z.number()
});

export type SessionPermissions = z.infer<typeof SessionPermissionsSchema>;
