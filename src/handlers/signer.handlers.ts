import {SIGNER_SUPPORTED_STANDARDS} from '../constants/signer.constants';
import type {SignerMessageEventData} from '../signer';
import {
  IcrcWalletStatusRequestSchema,
  IcrcWalletSupportedStandardsRequestSchema
} from '../types/icrc-requests';
import type {IcrcReadyResponse, IcrcSupportedStandardsResponse} from '../types/icrc-responses';
import {
  JSON_RPC_VERSION_2,
  type RpcId,
  type RpcResponse,
  type RpcResponseError,
  type RpcResponseWithError
} from '../types/rpc';

interface Notify {
  id: RpcId;
  origin: string;
}

export const handleStatusRequest = ({
  data,
  ...rest
}: {data: SignerMessageEventData} & Pick<Notify, 'origin'>): {handled: boolean} => {
  const {success: isStatusRequest, data: statusData} =
    IcrcWalletStatusRequestSchema.safeParse(data);

  if (isStatusRequest) {
    const {id} = statusData;
    notifyReady({id, ...rest});
    return {handled: true};
  }

  return {handled: false};
};

const notifyReady = ({id, origin}: Notify): void => {
  const msg: IcrcReadyResponse = {
    jsonrpc: JSON_RPC_VERSION_2,
    id,
    result: 'ready'
  };

  notify({msg, origin});
};

export const handleSupportedStandards = ({
  data,
  ...rest
}: {data: SignerMessageEventData} & Pick<Notify, 'origin'>): {handled: boolean} => {
  const {success: isSupportedStandardsRequest, data: supportedStandardsData} =
    IcrcWalletSupportedStandardsRequestSchema.safeParse(data);

  if (isSupportedStandardsRequest) {
    const {id} = supportedStandardsData;
    notifySupportedStandards({id, ...rest});
    return {handled: true};
  }

  return {handled: false};
};

const notifySupportedStandards = ({id, origin}: Notify): void => {
  const msg: IcrcSupportedStandardsResponse = {
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
  error: RpcResponseError;
} & Notify): void => {
  const msg: RpcResponseWithError = {
    jsonrpc: JSON_RPC_VERSION_2,
    id,
    error
  };

  notify({msg, origin});
};

const notify = ({msg, origin}: {msg: RpcResponse} & Pick<Notify, 'origin'>): void =>
  window.opener.postMessage(msg, origin);
