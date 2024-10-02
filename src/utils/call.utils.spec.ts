import {TransferResult} from '../constants/icrc.idl.constants';
import {mockCallCanisterParams, mockCallCanisterSuccess} from '../mocks/call-canister.mocks';
import {mockLocalIcRootKey, mockRepliedLocalCertificate} from '../mocks/custom-http-agent-responses.mocks';
import {uint8ArrayToBase64} from './base64.utils';
import {assertCallArg, assertCallMethod, decodeResponse} from './call.utils';
import {mockRequestDetails} from "../mocks/custom-http-agent.mocks";
import {arrayBufferToUint8Array} from "@dfinity/utils";
import {Principal} from "@dfinity/principal";
import {encode} from "../agent/agentjs-cbor-copy";
import {IcrcCallCanisterRequestParams} from "../types/icrc-requests";
import {CallRequest} from "@dfinity/agent";
import {SubmitRequestType} from "@dfinity/agent/lib/cjs/agent/http/types";

vi.mock('@dfinity/agent', async (importOriginal) => {
  // eslint-disable-next-line @typescript-eslint/consistent-type-imports
  const originalModule = await importOriginal<typeof import('@dfinity/agent')>();

  class MockHttpAgent {
    call = vi.fn();
    create = vi.fn();

    get rootKey(): ArrayBuffer {
      return mockLocalIcRootKey.buffer;
    }
  }

  Object.defineProperty(MockHttpAgent, 'create', {
    value: vi.fn().mockResolvedValue(new MockHttpAgent()),
    writable: true
  });

  return {
    ...originalModule,
    HttpAgent: MockHttpAgent,
    pollForResponse: vi.fn()
  };
});

describe('call.utils', () => {
  describe('assertCallMethod', () => {
    it('should not throw an error when methods match', () => {
      const requestMethod = 'icrc1_transfer';
      const responseMethod = 'icrc1_transfer';

      expect(() => assertCallMethod({requestMethod, responseMethod})).not.toThrow();
    });

    it('should throw an error when methods do not match', () => {
      const requestMethod = 'icrc1_transfer';
      const responseMethod = 'test';

      expect(() => assertCallMethod({requestMethod, responseMethod})).toThrow(
        'The response method does not match the request method.'
      );
    });
  });

  describe('assertCallArg', () => {
    it('should not throw an error when arguments match', () => {
      const responseArg = new Uint8Array([1, 2, 3, 4, 5, 6, 7]);
      const requestArgBlob = uint8ArrayToBase64(responseArg);

      expect(() =>
        assertCallArg({
          requestArg: requestArgBlob,
          responseArg
        })
      ).not.toThrow();
    });

    it('should throw an error when arguments do not match', () => {
      const responseArg = new Uint8Array([1, 2, 3, 4, 5, 6, 7]);
      const requestArgBlob = uint8ArrayToBase64(new Uint8Array([1, 2, 3]));

      expect(() =>
        assertCallArg({
          requestArg: requestArgBlob,
          responseArg
        })
      ).toThrow('The response does not contain the request arguments.');
    });
  });

  describe('decodeResponse', () => {
    it("should decode success response", async () => {
      const callParams: IcrcCallCanisterRequestParams = {
        method: mockRequestDetails.method_name,
        canisterId: mockRequestDetails.canister_id.toText(),
        arg: uint8ArrayToBase64(arrayBufferToUint8Array(mockRequestDetails.arg)),
        sender: (mockRequestDetails.sender as Principal).toText(),
        nonce: uint8ArrayToBase64(mockRequestDetails.nonce as Uint8Array)
      };

      const callRequest: CallRequest = {
        method_name: callParams.method,
        canister_id: callParams.canisterId,
        request_type: SubmitRequestType.Call,
        arg: callParams.arg,
        sender: callParams.sender,
        nonce: callParams.nonce
      }

      const response = await decodeResponse({
        params: callParams,
        result: {
          certificate: mockRepliedLocalCertificate,
          contentMap:  uint8ArrayToBase64(arrayBufferToUint8Array(encode(contentMap)))
        },
        resultRecordClass: TransferResult
      });

      expect(response).toEqual({});
    })
  });
});
