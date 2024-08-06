import {SIGNER_SUPPORTED_STANDARDS} from '../constants/signer.constants';
import type {
  IcrcReadyResponseType,
  IcrcSupportedStandardsResponseType
} from '../types/icrc-responses';
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

export const notifySupportedStandards = ({id, origin}: Notify): void => {
  const msg: IcrcSupportedStandardsResponseType = {
    jsonrpc: JSON_RPC_VERSION_2,
    id,
    result: {
      supportedStandards: SIGNER_SUPPORTED_STANDARDS
    }
  };

  notify({msg, origin});
};

export const notifyError = ({
  id,
  error,
  origin
}: {
  error: RpcResponseErrorType;
} & Notify): void => {
  const msg: RpcResponseWithErrorType = {
    jsonrpc: JSON_RPC_VERSION_2,
    id,
    error
  };

  notify({msg, origin});
};

const notify = ({msg, origin}: {msg: RpcResponseType} & Pick<Notify, 'origin'>): void =>
  window.opener.postMessage(msg, origin);
