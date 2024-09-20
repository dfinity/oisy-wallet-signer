import {
  JSON_RPC_VERSION_2,
  type RpcResponse,
  type RpcResponseError,
  type RpcResponseWithError
} from '../types/rpc';
import type {Notify} from '../types/signer-handlers';

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

export const notify = ({msg, origin}: {msg: RpcResponse} & Pick<Notify, 'origin'>): void =>
  window.opener.postMessage(msg, origin);
