import {DEFAULT_POLLING_INTERVAL_IN_MILLISECONDS} from '../constants/core.constants';
import {
  ICRC25_PERMISSIONS,
  ICRC25_REQUEST_PERMISSIONS,
  ICRC25_SUPPORTED_STANDARDS,
  ICRC29_STATUS
} from '../constants/icrc.constants';
import type {
  IcrcAnyRequestedScopes,
  IcrcPermissionsRequest,
  IcrcRequestAnyPermissionsRequest,
  IcrcStatusRequest,
  IcrcSupportedStandardsRequest
} from '../types/icrc-requests';
import {JSON_RPC_VERSION_2, type RpcId} from '../types/rpc';
import {retryUntilReady, type ReadyOrError} from '../utils/timeout.utils';

interface Request {
  id: RpcId;
  popup: Window;
  origin: string;
}

type Response<T> = {msg: T} & Pick<Request, 'origin' | 'popup'>;

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
    const msg: IcrcStatusRequest = {
      jsonrpc: JSON_RPC_VERSION_2,
      id,
      method: ICRC29_STATUS
    };

    // Since we are polling, we don't want to force the popup to the front in case the user has intentionally brought another window to the forefront.
    postMsg({popup, msg, origin: '*'});
  };

  return await retryUntilReady({
    retries:
      timeoutInMilliseconds / (intervalInMilliseconds ?? DEFAULT_POLLING_INTERVAL_IN_MILLISECONDS),
    intervalInMilliseconds,
    isReady,
    fn: requestStatus
  });
};

export const requestSupportedStandards = ({id, ...rest}: Request): void => {
  const msg: IcrcSupportedStandardsRequest = {
    jsonrpc: JSON_RPC_VERSION_2,
    id,
    method: ICRC25_SUPPORTED_STANDARDS
  };

  // Requesting supported standards does not require user interaction therefore it can be queried without focusing the popup.
  postMsg({msg, ...rest});
};

export const permissions = ({id, ...rest}: Request): void => {
  const msg: IcrcPermissionsRequest = {
    jsonrpc: JSON_RPC_VERSION_2,
    id,
    method: ICRC25_PERMISSIONS
  };

  // Requesting the state of all permissions does not require user interaction therefore it can be queried without focusing the popup.
  postMsg({msg, ...rest});
};

export const requestPermissions = ({
  id,
  scopes,
  ...rest
}: Request & IcrcAnyRequestedScopes): void => {
  const msg: IcrcRequestAnyPermissionsRequest = {
    jsonrpc: JSON_RPC_VERSION_2,
    id,
    method: ICRC25_REQUEST_PERMISSIONS,
    params: {scopes}
  };

  focusAndPostMsg({msg, ...rest});
};

const focusAndPostMsg = <T>({popup, ...rest}: Response<T>): void => {
  // We focus the popup to bring it to front.
  popup.focus();

  postMsg({popup, ...rest});
};

const postMsg = <T>({popup, msg, origin}: Response<T>): void => {
  popup.postMessage(msg, origin);
};
