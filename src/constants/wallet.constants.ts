import {IcrcWalletScopedMethodSchema} from '../types/icrc';
import type {IcrcRequestedScopes} from '../types/icrc-requests';

export const WALLET_CONNECT_DEFAULT_TIMEOUT_IN_MILLISECONDS = 60 * 2 * 1000;
export const WALLET_CONNECT_TIMEOUT_REQUEST_SUPPORTED_STANDARD = 5000;

export const {scopes: WALLET_DEFAULT_SCOPES}: IcrcRequestedScopes = {
  scopes: Object.values(IcrcWalletScopedMethodSchema.Values).map((method) => ({method}))
};
