import {SIGNER_SUPPORTED_STANDARDS} from '../constants/signer.constants';
import type {IcrcAccounts} from '../types/icrc-accounts';
import type {
  IcrcAccountsResponse,
  IcrcCallCanisterResponse,
  IcrcCallCanisterResult,
  IcrcReadyResponse,
  IcrcScopesArray,
  IcrcScopesResponse,
  IcrcSupportedStandardsResponse
} from '../types/icrc-responses';
import {JSON_RPC_VERSION_2} from '../types/rpc';
import type {Notify} from '../types/signer-handlers';
import {notify} from './signer.handlers';

export const notifyReady = ({id, origin, source}: Notify): void => {
  const msg: IcrcReadyResponse = {
    jsonrpc: JSON_RPC_VERSION_2,
    id,
    result: 'ready'
  };

  notify({msg, origin, source});
};

export const notifySupportedStandards = ({id, origin, source}: Notify): void => {
  const msg: IcrcSupportedStandardsResponse = {
    jsonrpc: JSON_RPC_VERSION_2,
    id,
    result: {
      supportedStandards: SIGNER_SUPPORTED_STANDARDS
    }
  };

  notify({msg, origin, source});
};

export type NotifyPermissions = Notify & {scopes: IcrcScopesArray};

export const notifyPermissionScopes = ({id, origin, scopes, source}: NotifyPermissions): void => {
  const msg: IcrcScopesResponse = {
    jsonrpc: JSON_RPC_VERSION_2,
    id,
    result: {scopes}
  };

  notify({msg, origin, source});
};

export type NotifyAccounts = Notify & {accounts: IcrcAccounts};

export const notifyAccounts = ({id, origin, accounts, source}: NotifyAccounts): void => {
  const msg: IcrcAccountsResponse = {
    jsonrpc: JSON_RPC_VERSION_2,
    id,
    result: {accounts}
  };

  notify({msg, origin, source});
};

export type NotifyCallCanister = Notify & {result: IcrcCallCanisterResult};

export const notifyCallCanister = ({id, origin, result, source}: NotifyCallCanister): void => {
  const msg: IcrcCallCanisterResponse = {
    jsonrpc: JSON_RPC_VERSION_2,
    id,
    result
  };

  notify({msg, origin, source});
};
