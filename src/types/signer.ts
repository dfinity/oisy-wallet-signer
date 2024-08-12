import {z} from 'zod';
import {
  IcrcPermissionsRequestSchema,
  IcrcRequestPermissionsRequestSchema,
  IcrcStatusRequestSchema,
  IcrcSupportedStandardsRequestSchema
} from './icrc-requests';

const SignerMessageEventDataSchema = z
  .union([
    IcrcStatusRequestSchema,
    IcrcRequestPermissionsRequestSchema,
    IcrcPermissionsRequestSchema,
    IcrcSupportedStandardsRequestSchema
  ])
  .optional();

export type SignerMessageEventData = z.infer<typeof SignerMessageEventDataSchema>;

export type SignerMessageEvent = MessageEvent<SignerMessageEventData | never>;
