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

// TODO: instead of window.opener try to sent the message to MessageEvent.source first.
// This is safer in case the signer is opened with redirect in the future.
// e.g. per user canister pattern
export const notify = ({msg, origin}: {msg: RpcResponse} & Pick<Notify, 'origin'>): void =>
  window.opener.postMessage(msg, origin);
