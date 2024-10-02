import {arrayBufferToUint8Array} from '@dfinity/utils';
import {IcrcBlob} from '../types/blob';
import {Method} from '../types/icrc-requests';
import {base64ToUint8Array} from './base64.utils';

export const assertCallMethod = ({
  requestMethod,
  responseMethod
}: {
  responseMethod: string;
  requestMethod: Method;
}) => {
  if (responseMethod !== requestMethod) {
    throw new Error('The response method does not match the request method.');
  }
};

export const assertCallArg = ({
  responseArg,
  requestArg: requestArgBlob
}: {
  responseArg: ArrayBuffer;
  requestArg: IcrcBlob;
}) => {
  const requestArg = base64ToUint8Array(requestArgBlob);
  const callRequestArg = arrayBufferToUint8Array(responseArg);

  const uint8ArrayEqual = ({first, second}: {first: Uint8Array; second: Uint8Array}): boolean =>
    // eslint-disable-next-line local-rules/prefer-object-params
    first.length === second.length && first.every((value, index) => value === second[index]);

  if (!uint8ArrayEqual({first: requestArg, second: callRequestArg})) {
    throw new Error('The response does not contain the request arguments.');
  }
};
