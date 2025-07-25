import type {CallRequest, Expiry} from '@dfinity/agent';
import {decode} from '@dfinity/cbor';
import {Principal} from '@dfinity/principal';
import {base64ToUint8Array} from '@dfinity/utils';
import type {BigNumber} from 'bignumber.js';
import type {IcrcBlob} from '../types/blob';

export const decodeCallRequest = (contentMap: IcrcBlob): CallRequest => {
  type IngressExpiryAgentJSv3 = {_value: bigint};
  type IngressExpiryAgentJSv2 = BigNumber;

  type CborCallRequest = Omit<CallRequest, 'ingress_expiry' | 'canister_id'> & {
    ingress_expiry: IngressExpiryAgentJSv3 | IngressExpiryAgentJSv2;
    canister_id: Uint8Array;
  };

  // The decode function copied from agent-js is buggy or does not support decoding the ingress_expiry to BigInt or Expiry. It seems that the value is a BigNumber. That's why we have to strip it from the response and convert it manually.
  // It does not parse Principal neither.
  const {ingress_expiry, canister_id, sender, ...callRequestRest} = decode<CborCallRequest>(
    base64ToUint8Array(contentMap)
  );

  console.log('callRequestRest: ', ingress_expiry);

  return {
    ...callRequestRest,
    canister_id: Principal.from(canister_id),
    sender: Principal.from(sender).toUint8Array(),
    // There is no constructor or setter to create an agent-js Expiry from a bigint. Type which is expected by CallRequest. Given that we solely require the wrapped BigInt in this function, we can resolve the issue with an ugly cast.
    ingress_expiry: ('_value' in ingress_expiry
      ? ingress_expiry._value
      : BigInt(ingress_expiry.toFixed())) as unknown as Expiry
  } as CallRequest;
};
