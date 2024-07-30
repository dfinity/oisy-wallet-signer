import {ICRC29_STATUS} from '../types/icrc';
import type {IcrcWalletStatusRequestType} from '../types/icrc-requests';
import {JSON_RPC_VERSION_2} from '../types/rpc';
import {retryUntilReady} from '../utils/timeout.utils';

export const retryRequestStatus = async ({
  popup,
  isReady,
  msgId: id
}: {
  popup: Window;
  isReady: () => boolean;
  msgId: string;
}): Promise<'ready' | 'timeout'> => {
  const requestStatus = (): void => {
    const msg: IcrcWalletStatusRequestType = {
      jsonrpc: JSON_RPC_VERSION_2,
      id,
      method: ICRC29_STATUS
    };

    popup.postMessage(msg, '*');
  };

  return await retryUntilReady({
    // TODO: extract a variable and default value for the Wallet
    retries: 60, // 30 seconds
    isReady,
    fn: requestStatus
  });
};
