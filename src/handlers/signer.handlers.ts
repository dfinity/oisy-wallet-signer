import type {IcrcReadyResponseType} from '../types/icrc-responses';
import {JSON_RPC_VERSION_2} from '../types/rpc';

export const notifyReady = ({msgId: id}: {msgId: string}): void => {
  const msg: IcrcReadyResponseType = {
    jsonrpc: JSON_RPC_VERSION_2,
    id,
    result: 'ready'
  };

  window.opener.postMessage(msg, origin);
};
