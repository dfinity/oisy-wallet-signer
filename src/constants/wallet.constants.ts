import type {IcrcRequestedScopes} from '../types/icrc-requests';
import {SIGNER_SUPPORTED_SCOPES} from './signer.constants';

export const WALLET_CONNECT_DEFAULT_TIMEOUT_IN_MILLISECONDS = 60 * 2 * 1000;
export const WALLET_CONNECT_TIMEOUT_REQUEST_SUPPORTED_STANDARD = 5000;

export const WALLET_DEFAULT_SCOPES: IcrcRequestedScopes = {
  scopes: SIGNER_SUPPORTED_SCOPES.map(({scope}) => scope)
};
