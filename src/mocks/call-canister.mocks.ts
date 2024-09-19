import type {IcrcCallCanisterRequestParams} from '../types/icrc-requests';
import {uint8ArrayToBase64} from '../utils/base64.utils';
import {mockPrincipalText} from './icrc-accounts.mocks';

export const mockCallCanisterParams: IcrcCallCanisterRequestParams = {
  canisterId: mockPrincipalText,
  sender: mockPrincipalText,
  method: 'some_method',
  arg: uint8ArrayToBase64(new Uint8Array([1, 2, 3, 4, 5, 6, 7]))
};
