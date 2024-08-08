import type {
  IcrcWalletPermissionsRequest,
  IcrcWalletRequestPermissionsRequest,
  IcrcWalletStatusRequest,
  IcrcWalletSupportedStandardsRequest
} from './icrc-requests';

export type SignerMessageEventData = Partial<
  | IcrcWalletStatusRequest
  | IcrcWalletRequestPermissionsRequest
  | IcrcWalletPermissionsRequest
  | IcrcWalletSupportedStandardsRequest
>;

export type SignerMessageEvent = MessageEvent<SignerMessageEventData>;
