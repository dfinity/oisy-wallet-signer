import {Expiry} from '@icp-sdk/core/agent';
import {Principal} from '@icp-sdk/core/principal';
import {mockEncodedContentMap} from '../mocks/call-canister.mocks';
import {mockRequestDetails} from '../mocks/custom-http-agent.mocks';
import {decodeCallRequest} from './agentjs-cbor-copy.utils';

describe('agentjs-cbor-copy.utils', () => {
  it('should decode a valid call request', () => {
    const callRequest = decodeCallRequest(mockEncodedContentMap);

    expect(callRequest.arg).toEqual(mockRequestDetails.arg);

    expect(callRequest.canister_id).toBeInstanceOf(Principal);
    expect(callRequest.canister_id.toText()).toEqual(mockRequestDetails.canister_id.toText());

    expect(callRequest.ingress_expiry).toBeInstanceOf(Expiry);
    expect(callRequest.ingress_expiry.toBigInt()).toEqual(
      mockRequestDetails.ingress_expiry.toBigInt()
    );

    expect(callRequest.method_name).toEqual(mockRequestDetails.method_name);

    expect(callRequest.nonce).toBeInstanceOf(Uint8Array);
    expect(callRequest.nonce).toEqual(mockRequestDetails.nonce);

    expect(callRequest.request_type).toEqual(mockRequestDetails.request_type);

    expect((callRequest.sender as Principal).toUint8Array()).toEqual(
      (mockRequestDetails.sender as Principal).toUint8Array()
    );
  });
});
