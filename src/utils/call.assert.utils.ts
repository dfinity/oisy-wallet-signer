import {Principal} from '@icp-sdk/core/principal';
import {base64ToUint8Array} from '@dfinity/utils';
import type {PrincipalText} from '@dfinity/zod-schemas';
import type {IcrcBlob} from '../types/blob';
import type {Method} from '../types/icrc-requests';

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
  responseArg: Uint8Array;
  requestArg: IcrcBlob;
}) => {
  const requestArg = base64ToUint8Array(requestArgBlob);
  const callRequestArg = responseArg;

  const uint8ArrayEqual = ({first, second}: {first: Uint8Array; second: Uint8Array}): boolean =>
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
