import {Principal} from '@dfinity/principal';
import {arrayBufferToUint8Array} from '@dfinity/utils';
import {IcrcBlob} from '../types/blob';
import {Method} from '../types/icrc-requests';
import {PrincipalText} from '../types/principal';
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

export const assertCallCanisterId = ({
  requestCanisterId,
  responseCanisterId
}: {
  responseCanisterId: Principal;
  requestCanisterId: Principal;
}) => {
  if (requestCanisterId.toText() !== responseCanisterId.toText()) {
    throw new Error('The response canister ID does not match the requested canister ID.');
  }
};

export const assertCallSender = ({
  requestSender,
  responseSender
}: {
  responseSender: Uint8Array | Principal;
  requestSender: PrincipalText;
}) => {
  const receivedSender =
    responseSender instanceof Uint8Array
      ? Principal.fromUint8Array(responseSender)
      : responseSender;

  if (receivedSender.toText() !== Principal.fromText(requestSender).toText()) {
    throw new Error('The response sender does not match the request sender.');
  }
};
