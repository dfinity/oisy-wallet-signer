import {Principal} from '@dfinity/principal';
import {arrayBufferToUint8Array} from '@dfinity/utils';
import {mockEncodedContentMap} from '../mocks/call-canister.mocks';
import {mockRequestDetails} from '../mocks/custom-http-agent.mocks';
import {decodeCallRequest} from './agentjs-cbor-copy.utils';

describe('agentjs-cbor-copy.utils', () => {
  it('should decode a valid call request', () => {
    const callRequest = decodeCallRequest(mockEncodedContentMap);

    expect(callRequest.arg).toEqual(mockRequestDetails.arg);

    expect(callRequest.canister_id).toBeInstanceOf(Principal);
    expect(callRequest.canister_id.toText()).toEqual(mockRequestDetails.canister_id.toText());

    // @ts-expect-error See comments in decodeCallRequest
    expect(callRequest.ingress_expiry).toEqual(mockRequestDetails.ingress_expiry._value);

    expect(callRequest.method_name).toEqual(mockRequestDetails.method_name);

    expect(callRequest.nonce).toBeInstanceOf(Uint8Array);
    expect(callRequest.nonce).toEqual(
      arrayBufferToUint8Array(mockRequestDetails.nonce as ArrayBuffer)
    );

    expect(callRequest.request_type).toEqual(mockRequestDetails.request_type);

    expect(callRequest.sender).toEqual((mockRequestDetails.sender as Principal).toUint8Array());
  });
});
