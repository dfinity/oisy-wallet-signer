import {Expiry, type Nonce} from '@dfinity/agent';
import {SubmitRequestType, type CallRequest} from '@dfinity/agent/lib/cjs/agent/http/types';
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

export const mockRequestPayloadWithNonce: Pick<
  IcrcCallCanisterRequestParams,
  'canisterId' | 'method' | 'arg' | 'nonce'
> = {
  arg: uint8ArrayToBase64(new Uint8Array([1, 2, 3, 4])),
  nonce: uint8ArrayToBase64(new Uint8Array([1, 4, 5, 2])),
  canisterId: mockCanisterId,
  method: mockRequestMethod
};

export const mockRequestDetails: CallRequest = {
  arg: new Uint8Array([68, 73, 68, 76, 6, 109, 123, 110, 0, 108]),
  canister_id: Principal.fromText(mockCanisterId),
  ingress_expiry: new Expiry(5 * 60 * 1000),
  method_name: mockRequestMethod,
  nonce: new Uint8Array([1, 2, 3]).buffer as Nonce,
  request_type: SubmitRequestType.Call,
  sender: Principal.fromText(mockPrincipalText)
};
