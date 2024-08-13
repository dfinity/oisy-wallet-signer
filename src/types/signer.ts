import {z} from 'zod';
import {
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
    IcrcSupportedStandardsRequestSchema
  ])
  .optional();

export type SignerMessageEventData = z.infer<typeof SignerMessageEventDataSchema>;

export type SignerMessageEvent = MessageEvent<SignerMessageEventData | never>;
