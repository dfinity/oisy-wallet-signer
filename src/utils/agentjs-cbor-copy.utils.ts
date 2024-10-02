import type {CallRequest, Expiry} from '@dfinity/agent';
import type {BigNumber} from 'bignumber.js';
import {decode} from '../agent/agentjs-cbor-copy';
import type {IcrcBlob} from '../types/blob';
import {base64ToUint8Array} from './base64.utils';

export const decodeCallRequest = (contentMap: IcrcBlob): CallRequest => {
  type CborCallRequest = Omit<CallRequest, 'ingress_expiry'> & {ingress_expiry: BigNumber};

  // The decode function copied from agent-js is buggy or does not support decoding the ingress_expiry to BigInt or Expiry. It seems that the value is a BigNumber. That's why we have to strip it from the response and convert it manually.
  const {ingress_expiry, ...callRequestRest} = decode<CborCallRequest>(
    base64ToUint8Array(contentMap)
  );

  return {
    ...callRequestRest,
    // There is no constructor or setter to create an agent-js Expiry from a bigint. Type which is expected by CallRequest. Given that we solely require the wrapped BigInt in this function, we can resolve the issue with an ugly cast.
    ingress_expiry: BigInt(ingress_expiry.toFixed()) as unknown as Expiry
  } as CallRequest;
};
