import {base64ToUint8Array} from '@dfinity/utils';
import {PrincipalTextSchema} from '@dfinity/zod-schemas';
import * as z from 'zod';
import {IcrcBlobSchema} from './blob';

const IcrcSubaccountSchema = IcrcBlobSchema.refine(
  (value) => {
    try {
      return base64ToUint8Array(value).length === 32;
    } catch (_err: unknown) {
      return false;
    }
  },
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
