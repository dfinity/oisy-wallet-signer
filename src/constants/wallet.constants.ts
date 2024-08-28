import type {IcrcRequestedScopes} from '../types/icrc-requests';
import {IcrcScopedMethodSchema} from '../types/icrc-standards';

const WALLET_TIMEOUT_IN_MILLISECONDS_WITH_USER_INTERACTION = 60 * 2 * 1000;
const WALLET_TIMEOUT_IN_MILLISECONDS_WITHOUT_USER_INTERACTION = 5000;

export const WALLET_CONNECT_TIMEOUT_IN_MILLISECONDS =
  WALLET_TIMEOUT_IN_MILLISECONDS_WITH_USER_INTERACTION;
export const WALLET_TIMEOUT_REQUEST_SUPPORTED_STANDARD =
  WALLET_TIMEOUT_IN_MILLISECONDS_WITHOUT_USER_INTERACTION;
export const WALLET_TIMEOUT_REQUEST_PERMISSIONS =
  WALLET_TIMEOUT_IN_MILLISECONDS_WITH_USER_INTERACTION;
export const WALLET_TIMEOUT_PERMISSIONS = WALLET_TIMEOUT_IN_MILLISECONDS_WITHOUT_USER_INTERACTION;
export const WALLET_TIMEOUT_ACCOUNTS = WALLET_TIMEOUT_IN_MILLISECONDS_WITH_USER_INTERACTION;
export const WALLET_TIMEOUT_CALL_CANISTER = WALLET_TIMEOUT_IN_MILLISECONDS_WITH_USER_INTERACTION;

export const {scopes: WALLET_DEFAULT_SCOPES}: IcrcRequestedScopes = {
  scopes: Object.values(IcrcScopedMethodSchema.Values).map((method) => ({method}))
};
