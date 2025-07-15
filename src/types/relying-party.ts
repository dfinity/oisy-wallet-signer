import * as z from 'zod';
import {IcrcScopesSchema, IcrcSupportedStandardsSchema} from './icrc-responses';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const RelyingPartyMessageEventDataSchema = z
  .union([IcrcSupportedStandardsSchema, IcrcScopesSchema])
  .optional();

export type RelyingPartyMessageEventData = z.infer<typeof RelyingPartyMessageEventDataSchema>;

export type RelyingPartyMessageEvent = MessageEvent<RelyingPartyMessageEventData | never>;
