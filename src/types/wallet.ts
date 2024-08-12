import {z} from 'zod';
import {IcrcScopesSchema, IcrcSupportedStandardsSchema} from './icrc-responses';

const WalletMessageEventDataSchema = z
  .union([IcrcSupportedStandardsSchema, IcrcScopesSchema])
  .optional();

export type WalletMessageEventData = z.infer<typeof WalletMessageEventDataSchema>;

export type WalletMessageEvent = MessageEvent<WalletMessageEventData | never>;
