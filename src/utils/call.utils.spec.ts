import {Principal} from '@dfinity/principal';
import {TransferResult} from '../constants/icrc.idl.constants';
import {
  mockLocalBlockHeight,
  mockLocalCallParams,
  mockLocalCallResult,
  mockLocalCallTime
} from '../mocks/call-utils.mocks';
import {mockLocalIcRootKey} from '../mocks/custom-http-agent-responses.mocks';
import {mockCanisterId, mockPrincipalText} from '../mocks/icrc-accounts.mocks';
import {uint8ArrayToBase64} from './base64.utils';
import {assertCallArg, assertCallCanisterId, assertCallMethod, decodeResponse} from './call.utils';

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

  describe('assertCallCanisterId', () => {
    it('should not throw an error when canister ID match', () => {
      const requestCanisterId = Principal.fromText(mockCanisterId);
      const responseCanisterId = Principal.fromText(mockCanisterId);

      expect(() => assertCallCanisterId({requestCanisterId, responseCanisterId})).not.toThrow();
    });

    it('should throw an error when methods do not match', () => {
      const requestCanisterId = Principal.fromText(mockCanisterId);
      const responseCanisterId = Principal.fromText(mockPrincipalText);

      expect(() => assertCallCanisterId({requestCanisterId, responseCanisterId})).toThrow(
        'The response canister ID does not match the requested canister ID.'
      );
    });
  });

  describe('decodeResponse', () => {
    beforeEach(() => {
      vi.setSystemTime(mockLocalCallTime);
    });

    afterEach(() => {
      vi.clearAllMocks();
      vi.useRealTimers();
    });

    it('should decode success response', async () => {
      const response = await decodeResponse({
        params: mockLocalCallParams,
        result: mockLocalCallResult,
        resultRecordClass: TransferResult
      });

      expect(response).toEqual({
        Ok: mockLocalBlockHeight
      });
    });

    // TODO: enhance testing with edge case and invalid responses.
  });
});
