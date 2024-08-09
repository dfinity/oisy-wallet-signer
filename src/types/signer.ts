import type {
  IcrcPermissionsRequest,
  IcrcRequestPermissionsRequest,
  IcrcStatusRequest,
  IcrcSupportedStandardsRequest
} from './icrc-requests';

export type SignerMessageEventData = Partial<
  | IcrcStatusRequest
  | IcrcRequestPermissionsRequest
  | IcrcPermissionsRequest
  | IcrcSupportedStandardsRequest
>;

export type SignerMessageEvent = MessageEvent<SignerMessageEventData | never>;
