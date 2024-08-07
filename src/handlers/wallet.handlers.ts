import {DEFAULT_POLLING_INTERVAL_IN_MILLISECONDS} from '../constants/core.constants';
import {ICRC29_STATUS} from '../types/icrc';
import type {IcrcWalletStatusRequestType} from '../types/icrc-requests';
import {JSON_RPC_VERSION_2, type RpcIdType} from '../types/rpc';
import {retryUntilReady, type ReadyOrError} from '../utils/timeout.utils';

export const retryRequestStatus = async ({
  popup,
  isReady,
  id,
  timeoutInMilliseconds,
  intervalInMilliseconds
}: {
  popup: Window;
  isReady: () => ReadyOrError | 'pending';
  id: RpcIdType;
  timeoutInMilliseconds: number;
  intervalInMilliseconds?: number;
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
    retries:
      timeoutInMilliseconds / (intervalInMilliseconds ?? DEFAULT_POLLING_INTERVAL_IN_MILLISECONDS),
    intervalInMilliseconds,
    isReady,
    fn: requestStatus
  });
};
