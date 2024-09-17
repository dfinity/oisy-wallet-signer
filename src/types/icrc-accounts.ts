import {z} from 'zod';
import {IcrcBlob} from './blob';
import {PrincipalTextSchema} from './principal';

export const IcrcAccountSchema = z
  .object({
    owner: PrincipalTextSchema,
    subaccount: IcrcBlob.optional()
  })
  .strict();

export type IcrcAccount = z.infer<typeof IcrcAccountSchema>;

export const IcrcAccountsSchema = z.array(IcrcAccountSchema).min(1);

export type IcrcAccounts = z.infer<typeof IcrcAccountsSchema>;
