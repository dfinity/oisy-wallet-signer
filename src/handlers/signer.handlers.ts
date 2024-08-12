import {SIGNER_SUPPORTED_STANDARDS} from '../constants/signer.constants';
import type {
  IcrcReadyResponse,
  IcrcScope,
  IcrcScopesResponse,
  IcrcSupportedStandardsResponse
} from '../types/icrc-responses';
import {
  JSON_RPC_VERSION_2,
  type RpcId,
  type RpcResponse,
  type RpcResponseError,
  type RpcResponseWithError
} from '../types/rpc';

interface Notify {
  id: RpcId;
  origin: string;
}

export const notifyReady = ({id, origin}: Notify): void => {
  const msg: IcrcReadyResponse = {
    jsonrpc: JSON_RPC_VERSION_2,
    id,
    result: 'ready'
  };

  notify({msg, origin});
};

export const notifySupportedStandards = ({id, origin}: Notify): void => {
  const msg: IcrcSupportedStandardsResponse = {
    jsonrpc: JSON_RPC_VERSION_2,
    id,
    result: {
      supportedStandards: SIGNER_SUPPORTED_STANDARDS
    }
  };

  notify({msg, origin});
};

export const notifyPermissionScopes = ({
  id,
  origin,
  scopes
}: Notify & {scopes: IcrcScope[]}): void => {
  const msg: IcrcScopesResponse = {
    jsonrpc: JSON_RPC_VERSION_2,
    id,
    result: {scopes}
  };

  notify({msg, origin});
};

export const notifyError = ({
  id,
  error,
  origin
}: {
  error: RpcResponseError;
} & Notify): void => {
  const msg: RpcResponseWithError = {
    jsonrpc: JSON_RPC_VERSION_2,
    id,
    error
  };

  notify({msg, origin});
};

const notify = ({msg, origin}: {msg: RpcResponse} & Pick<Notify, 'origin'>): void =>
  window.opener.postMessage(msg, origin);
