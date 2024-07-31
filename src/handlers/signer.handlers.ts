import type {IcrcReadyResponseType} from '../types/icrc-responses';
import {
  JSON_RPC_VERSION_2,
  type RpcIdType,
  type RpcResponseErrorType,
  type RpcResponseType,
  type RpcResponseWithErrorType
} from '../types/rpc';

interface Notify {
  id: RpcIdType;
  origin: string;
}

export const notifyReady = ({id, origin}: Notify): void => {
  const msg: IcrcReadyResponseType = {
    jsonrpc: JSON_RPC_VERSION_2,
    id,
    result: 'ready'
  };

  notify({msg, origin});
};

export const notifyAndThrowError = ({
  id,
  error,
  origin
}: {
  error: RpcResponseErrorType;
} & Notify): never => {
  const msg: RpcResponseWithErrorType = {
    jsonrpc: JSON_RPC_VERSION_2,
    id,
    error
  };

  notify({msg, origin});

  throw new Error(error.message);
};

const notify = ({msg, origin}: {msg: RpcResponseType} & Pick<Notify, 'origin'>): void =>
  window.opener.postMessage(msg, origin);
