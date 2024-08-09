import {DEFAULT_POLLING_INTERVAL_IN_MILLISECONDS} from '../constants/core.constants';
import {ICRC25_SUPPORTED_STANDARDS, ICRC29_STATUS} from '../constants/icrc.constants';
import type {
  IcrcWalletStatusRequest,
  IcrcWalletSupportedStandardsRequest
} from '../types/icrc-requests';
import {JSON_RPC_VERSION_2, type RpcId} from '../types/rpc';
import {retryUntilReady, type ReadyOrError} from '../utils/timeout.utils';

interface Request {
  id: RpcId;
  popup: Window;
  origin: string;
}

export const retryRequestStatus = async ({
  popup,
  id,
  isReady,
  timeoutInMilliseconds,
  intervalInMilliseconds
}: Omit<Request, 'origin'> & {
  isReady: () => ReadyOrError | 'pending';
  timeoutInMilliseconds: number;
  intervalInMilliseconds?: number;
}): Promise<ReadyOrError | 'timeout'> => {
  const requestStatus = (): void => {
    const msg: IcrcWalletStatusRequest = {
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

export const requestSupportedStandards = ({popup, id, origin}: Request): void => {
  const msg: IcrcWalletSupportedStandardsRequest = {
    jsonrpc: JSON_RPC_VERSION_2,
    id,
    method: ICRC25_SUPPORTED_STANDARDS
  };

  popup.postMessage(msg, origin);
};
