import {Expiry, JSON_KEY_EXPIRY, type CallRequest} from '@dfinity/agent';
import {decode} from '@dfinity/cbor';
import {Principal} from '@dfinity/principal';
import {base64ToUint8Array} from '@dfinity/utils';
import type {IcrcBlob} from '../types/blob';

// Expiry doesn't have a fromBigInt static method yet
const bigIntToExpiry = (val: bigint) => {
  const jsonExpiry = JSON.stringify({[JSON_KEY_EXPIRY]: val.toString()});
  return Expiry.fromJSON(jsonExpiry);
};

export const decodeCallRequest = (contentMap: IcrcBlob): CallRequest => {
  const bytes = base64ToUint8Array(contentMap);

  // eslint-disable-next-line local-rules/prefer-object-params
  const decoded = decode(bytes, (val, key) => {
    if (key === 'canister_id' || key === 'sender') {
      return Principal.from(val);
    }

    if (key === 'ingress_expiry') {
      if (Expiry.isExpiry(val)) {
        return bigIntToExpiry(val['__expiry__']);
      }
      return bigIntToExpiry(val);
    }

    return val;
  });

  return decoded;
};
