import type {IcrcScopes, IcrcSupportedStandards} from './icrc-responses';

export type WalletMessageEventData = Partial<IcrcSupportedStandards | IcrcScopes>;

export type WalletMessageEvent = MessageEvent<WalletMessageEventData | never>;
