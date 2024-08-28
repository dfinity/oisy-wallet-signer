import {Principal} from '@dfinity/principal';
import {arrayOfNumberToUint8Array} from '@dfinity/utils';
import {z} from 'zod';

const IcrcSubaccountSchema = z
  .union([z.instanceof(Uint8Array), z.array(z.number())])
  .refine(
    (value) =>
      (value instanceof Uint8Array ? value : arrayOfNumberToUint8Array(value)).length === 32,
    {
      message: 'Subaccount must be exactly 32 bytes long.'
    }
  );

export const PrincipalTextSchema = z.string().refine(
  (principal) => {
    try {
      Principal.fromText(principal);
      return true;
    } catch (err: unknown) {
      return false;
    }
  },
  {
    message: 'Invalid textual representation of a Principal.'
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
