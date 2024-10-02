import {
  AnonymousIdentity,
  Certificate,
  HttpAgent,
  lookupResultToBuffer,
  requestIdOf
} from '@dfinity/agent';
import {RecordClass, VariantClass} from '@dfinity/candid/lib/cjs/idl';
import {Principal} from '@dfinity/principal';
import {arrayBufferToUint8Array, assertNonNullish} from '@dfinity/utils';
import {MAINNET_REPLICA_URL} from '../../demo/src/core/constants/app.constants';
import {IcrcBlob} from '../types/blob';
import {IcrcCallCanisterRequestParams, Method} from '../types/icrc-requests';
import type {IcrcCallCanisterResult} from '../types/icrc-responses';
import {decodeCallRequest} from './agentjs-cbor-copy.utils';
import {base64ToUint8Array} from './base64.utils';
import {decodeResult} from './idl.utils';

// Exposed for testing purposes
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

// Exposed for testing purposes
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

export const decodeResponse = async <T>({
  params: {method, arg, canisterId},
  result: {certificate: cert, contentMap},
  resultRecordClass
}: {
  params: IcrcCallCanisterRequestParams;
  result: IcrcCallCanisterResult;
  resultRecordClass: RecordClass | VariantClass;
}): Promise<T> => {
  const callRequest = decodeCallRequest(contentMap);

  assertCallMethod({
    requestMethod: method,
    responseMethod: callRequest.method_name
  });

  assertCallArg({
    requestArg: arg,
    responseArg: callRequest.arg
  });

  // We have to create an agent to retrieve the rootKey, which is both inefficient and a bit ugly to some extension.
  const {
    location: {origin}
  } = window;

  const localhost = ['localhost', '127.0.0.1'].includes(origin);

  const agent = await HttpAgent.create({
    identity: new AnonymousIdentity(),
    host: localhost ? origin : MAINNET_REPLICA_URL,
    ...(localhost && {shouldFetchRootKey: true})
  });

  const certificate = await Certificate.create({
    certificate: base64ToUint8Array(cert),
    rootKey: agent.rootKey,
    canisterId: Principal.fromText(canisterId)
  });

  const requestId = requestIdOf(callRequest);

  const path = [new TextEncoder().encode('request_status'), requestId];

  const reply = lookupResultToBuffer(certificate.lookup([...path, 'reply']));

  assertNonNullish(
    reply,
    'A reply cannot be resolved within the provided certificate. This is unexpected; it should have been known at this point.'
  );

  return decodeResult<T>({
    recordClass: resultRecordClass,
    reply
  });
};
