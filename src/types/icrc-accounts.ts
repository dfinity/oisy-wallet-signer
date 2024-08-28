import {arrayOfNumberToUint8Array} from '@dfinity/utils';
import {z} from 'zod';
import {IcrcBlob} from './blob';
import {PrincipalTextSchema} from './principal';

const IcrcSubaccountSchema = z
  .union([IcrcBlob, z.array(z.number())])
  .refine(
    (value) =>
      (value instanceof Uint8Array ? value : arrayOfNumberToUint8Array(value)).length === 32,
    {
      message: 'Subaccount must be exactly 32 bytes long.'
    }
  );

export const IcrcAccountSchema = z
  .object({
    owner: PrincipalTextSchema,
    subaccount: IcrcSubaccountSchema.optional()
  })
  .strict();

export type IcrcAccount = z.infer<typeof IcrcAccountSchema>;

export const IcrcAccountsSchema = z.array(IcrcAccountSchema).min(1);

export type IcrcAccounts = z.infer<typeof IcrcAccountsSchema>;
