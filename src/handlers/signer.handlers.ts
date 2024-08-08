import {SIGNER_SUPPORTED_STANDARDS} from '../constants/signer.constants';
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
import type {SignerMessageEvent} from '../types/signer';

type Notify = {id: RpcId} & Pick<SignerMessageEvent, 'origin'>;

export const handleStatusRequest = ({data, origin}: SignerMessageEvent): {handled: boolean} => {
  const {success: isStatusRequest, data: statusData} =
    IcrcWalletStatusRequestSchema.safeParse(data);

  if (isStatusRequest) {
    const {id} = statusData;
    notifyReady({id, origin});
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
  origin
}: SignerMessageEvent): {handled: boolean} => {
  const {success: isSupportedStandardsRequest, data: supportedStandardsData} =
    IcrcWalletSupportedStandardsRequestSchema.safeParse(data);

  if (isSupportedStandardsRequest) {
    const {id} = supportedStandardsData;
    notifySupportedStandards({id, origin});
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
