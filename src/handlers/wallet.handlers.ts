import {ICRC29_STATUS} from '../types/icrc';
import type {IcrcWalletStatusRequestType} from '../types/icrc-requests';
import {JSON_RPC_VERSION_2, type RpcIdType} from '../types/rpc';
import {retryUntilReady, type ReadyOrError} from '../utils/timeout.utils';

export const retryRequestStatus = async ({
  popup,
  isReady,
  id,
  timeoutInSeconds
}: {
  popup: Window;
  isReady: () => ReadyOrError | 'pending';
  id: RpcIdType;
  timeoutInSeconds: number;
}): Promise<ReadyOrError | 'timeout'> => {
  const requestStatus = (): void => {
    const msg: IcrcWalletStatusRequestType = {
      jsonrpc: JSON_RPC_VERSION_2,
      id,
      method: ICRC29_STATUS
    };

    popup.postMessage(msg, '*');
  };

  return await retryUntilReady({
    retries: timeoutInSeconds * 2, // The default intervalInMs is 0.5 seconds
    isReady,
    fn: requestStatus
  });
};
