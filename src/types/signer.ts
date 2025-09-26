import * as z from 'zod';
import {
  IcrcAccountsRequestSchema,
  IcrcPermissionsRequestSchema,
  IcrcRequestAnyPermissionsRequestSchema,
  IcrcStatusRequestSchema,
  IcrcSupportedStandardsRequestSchema
} from './icrc-requests';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
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

export type SignerMessageEvent = MessageEvent<SignerMessageEventData | never>;
