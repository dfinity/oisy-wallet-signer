import type {CallRequest} from '@icp-sdk/core/agent';
import {decode} from '@dfinity/cbor';
import {Principal} from '@icp-sdk/core/principal';
import {base64ToUint8Array} from '@dfinity/utils';
import type {IcrcBlob} from '../types/blob';
import {bigIntToExpiry} from './expiry.utils';

export const decodeCallRequest = (contentMap: IcrcBlob): CallRequest => {
  type CborCallRequest = Omit<CallRequest, 'ingress_expiry' | 'canister_id' | 'sender'> & {
    ingress_expiry: bigint;
    canister_id: Uint8Array;
    sender: Uint8Array;
  };

  // The decode function copied from agent-js is buggy or does not support decoding the ingress_expiry to BigInt or Expiry. It seems that the value is a BigNumber. That's why we have to strip it from the response and convert it manually.
  // It does not parse Principal neither.
  const {ingress_expiry, canister_id, sender, ...callRequestRest} = decode<CborCallRequest>(
    base64ToUint8Array(contentMap)
  );

  return {
    ...callRequestRest,
    canister_id: Principal.fromUint8Array(canister_id),
    sender: Principal.fromUint8Array(sender),
    ingress_expiry: bigIntToExpiry(ingress_expiry)
  } as CallRequest;
};
