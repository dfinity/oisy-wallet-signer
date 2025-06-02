import {type CallRequest, type Expiry, uint8ToBuf} from '@dfinity/agent';
import {Principal} from '@dfinity/principal';
import {base64ToUint8Array} from '@dfinity/utils';
import type {BigNumber} from 'bignumber.js';
import {decode} from '../agent/agentjs-cbor-copy';
import type {IcrcBlob} from '../types/blob';

export const decodeCallRequest = (contentMap: IcrcBlob): CallRequest => {
  type CborCallRequest = Omit<CallRequest, 'ingress_expiry' | 'canister_id'> & {
    ingress_expiry: BigNumber;
    canister_id: Uint8Array;
  };

  // The decode function copied from agent-js is buggy or does not support decoding the ingress_expiry to BigInt or Expiry. It seems that the value is a BigNumber. That's why we have to strip it from the response and convert it manually.
  // It does not parse Principal neither.
  const {ingress_expiry, canister_id, ...callRequestRest} = decode<CborCallRequest>(
    uint8ToBuf(base64ToUint8Array(contentMap))
  );

  return {
    ...callRequestRest,
    canister_id: Principal.fromUint8Array(canister_id),
    // There is no constructor or setter to create an agent-js Expiry from a bigint. Type which is expected by CallRequest. Given that we solely require the wrapped BigInt in this function, we can resolve the issue with an ugly cast.
    ingress_expiry: BigInt(ingress_expiry.toFixed()) as unknown as Expiry
  } as CallRequest;
};
