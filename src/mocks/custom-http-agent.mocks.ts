import {Expiry, SubmitRequestType, type CallRequest, type Nonce} from '@dfinity/agent';
import {Principal} from '@dfinity/principal';
import {uint8ArrayToBase64} from '@dfinity/utils';
import type {IcrcCallCanisterRequestParams} from '../types/icrc-requests';
import {mockCanisterId, mockPrincipalText} from './icrc-accounts.mocks';

export const mockRequestMethod = 'test-method';

export const mockRequestPayload: Pick<
  IcrcCallCanisterRequestParams,
  'canisterId' | 'method' | 'arg'
> = {
  arg: uint8ArrayToBase64(new Uint8Array([1, 2, 3, 4])),
  canisterId: mockCanisterId,
  method: mockRequestMethod
};

export const mockRequestPayloadWithNonce: Omit<IcrcCallCanisterRequestParams, 'sender'> = {
  ...mockRequestPayload,
  nonce: uint8ArrayToBase64(new Uint8Array([1, 2, 3]))
};

export const mockRequestDetails: CallRequest = {
  // TODO: This is corrected in next version of the agent.
  // @ts-expect-error arg is currently incorrectly typed in Agent-js. Instead of an ArrayBuffer it actually uses and provides an Uint8Array.
  arg: new Uint8Array([68, 73, 68, 76, 6, 109, 123, 110, 0, 108]),
  canister_id: Principal.fromText(mockCanisterId),
  ingress_expiry: new Expiry(5 * 60 * 1000),
  method_name: mockRequestMethod,
  nonce: new Uint8Array([1, 2, 3]).buffer as unknown as Nonce,
  request_type: SubmitRequestType.Call,
  sender: Principal.fromText(mockPrincipalText)
};

enum Endpoint {
  Query = 'read',
  ReadState = 'read_state',
  Call = 'call'
}

export const createMockRequest = ({
  ingress_expiry,
  nonce
}: {
  ingress_expiry?: Expiry;
  nonce?: Uint8Array;
}) => ({
  endpoint: Endpoint.Call,
  request: {
    headers: new Map()
  },
  body: {
    ...mockRequestDetails,
    ingress_expiry,
    nonce
  }
});
