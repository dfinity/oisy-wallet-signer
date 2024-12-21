// Auto-generated definitions file ("npm run i18n")
import {z} from 'zod';

export const i18nCoreSchema = z
  .object({
    amount: z.string(),
    from: z.string(),
    to: z.string(),
    fee: z.string()
  })
  .strict();

export const i18nIcrc1_transferSchema = z
  .object({
    title: z.string()
  })
  .strict();

export const i18nIcrc2_approveSchema = z
  .object({
    title: z.string(),
    address_is_allowed: z.string(),
    your_subaccount: z.string(),
    your_account: z.string(),
    requested_withdrawal_allowance: z.string(),
    withdrawal_allowance: z.object({some: z.string(), none: z.string()}),
    expiration_date: z.string(),
    approval_fee: z.string(),
    approver_account_transaction_fees: z.object({anonymous: z.string(), owner: z.string()})
  })
  .strict();

export const i18Schema = z
  .object({
    core: i18nCoreSchema,
    icrc1_transfer: i18nIcrc1_transferSchema,
    icrc2_approve: i18nIcrc2_approveSchema
  })
  .strict();

export type I18n = z.infer<typeof i18Schema>;
