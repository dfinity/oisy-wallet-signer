import {z} from 'zod';
import {
  IcrcAccountsRequestSchema,
  IcrcPermissionsRequestSchema,
  IcrcRequestAnyPermissionsRequestSchema,
  IcrcStatusRequestSchema,
  IcrcSupportedStandardsRequestSchema
} from './icrc-requests';

const SignerMessageEventDataSchema = z
  .union([
    IcrcStatusRequestSchema,
    IcrcRequestAnyPermissionsRequestSchema,
    IcrcPermissionsRequestSchema,
    IcrcSupportedStandardsRequestSchema,
    IcrcAccountsRequestSchema
  ])
  .optional();

export type SignerMessageEventData = z.infer<typeof SignerMessageEventDataSchema>;

export type SignerMessageEvent = Omit<MessageEvent<SignerMessageEventData | never>, 'source'> & {
  source: MessageEventSource;
};
