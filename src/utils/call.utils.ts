import {assertNonNullish, base64ToUint8Array} from '@dfinity/utils';
import {
  AnonymousIdentity,
  Certificate,
  HttpAgent,
  lookupResultToBuffer,
  requestIdOf
} from '@icp-sdk/core/agent';
import type {IDL} from '@icp-sdk/core/candid';
import {Principal} from '@icp-sdk/core/principal';
import {LOCAL_REPLICA_URL, MAINNET_REPLICA_URL} from '../constants/core.constants';
import type {IcrcCallCanisterRequestParams} from '../types/icrc-requests';
import type {IcrcCallCanisterResult} from '../types/icrc-responses';
import type {RelyingPartyHost} from '../types/relying-party-options';
import {decodeCallRequest} from './agentjs-cbor-copy.utils';
import {
  assertCallArg,
  assertCallCanisterId,
  assertCallMethod,
  assertCallSender
} from './call.assert.utils';
import {decodeIdl} from './idl.utils';

export const assertCallResponse = ({
  params: {method, arg, canisterId, sender},
  result: {contentMap}
}: {
  params: IcrcCallCanisterRequestParams;
  result: IcrcCallCanisterResult;
}) => {
  const callRequest = decodeCallRequest(contentMap);

  assertCallCanisterId({
    requestCanisterId: Principal.fromText(canisterId),
    responseCanisterId: callRequest.canister_id
  });

  assertCallMethod({
    requestMethod: method,
    responseMethod: callRequest.method_name
  });

  assertCallArg({
    requestArg: arg,
    responseArg: callRequest.arg
  });

  assertCallSender({
    requestSender: sender,
    responseSender: callRequest.sender
  });
};

export const decodeResponse = async <T>({
  params: {canisterId},
  result: {certificate: cert, contentMap},
  resultRecordClass,
  host
}: {
  params: IcrcCallCanisterRequestParams;
  result: IcrcCallCanisterResult;
  resultRecordClass: IDL.RecordClass | IDL.VariantClass;
  host?: RelyingPartyHost;
}): Promise<T> => {
  // TODO: improve performance by avoiding the need to decode the call requests multiple times. For example. IcpWallet and IcrcWallet could use a new protected function of RelyingParty that would extend call and return the callRequest that is asserted.
  const callRequest = decodeCallRequest(contentMap);

  // We have to create an agent to retrieve the rootKey, which is both inefficient and a bit ugly to some extension.
  const {
    location: {hostname}
  } = window;

  const localhost = ['localhost', '127.0.0.1'].includes(hostname);

  const agent = await HttpAgent.create({
    identity: new AnonymousIdentity(),
    host: localhost ? (host ?? LOCAL_REPLICA_URL) : MAINNET_REPLICA_URL,
    ...(localhost && {shouldFetchRootKey: true})
  });

  assertNonNullish(
    agent.rootKey,
    'Missing agent root key, which is required to certify the response.'
  );

  const certificate = await Certificate.create({
    certificate: base64ToUint8Array(cert),
    rootKey: agent.rootKey,
    canisterId: Principal.fromText(canisterId)
  });

  const requestId = requestIdOf(callRequest);

  const path = [new TextEncoder().encode('request_status'), requestId];

  const reply = lookupResultToBuffer(certificate.lookup_path([...path, 'reply']));

  // TODO: Instead of blindly throwing a general exception we can read the rejection and provide an error that contains details such as reject_message, error_code and reject_code.
  assertNonNullish(
    reply,
    'A reply cannot be resolved within the provided certificate. This is unexpected; it should have been known at this point.'
  );

  return decodeIdl<T>({
    recordClass: resultRecordClass,
    bytes: reply
  });
};
