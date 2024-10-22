import {Principal} from '@dfinity/principal';
import type {MockInstance} from 'vitest';
import {TransferResult} from '../constants/icrc.idl.constants';
import {
  mockLocalBlockHeight,
  mockLocalCallParams,
  mockLocalCallResult,
  mockLocalCallTime
} from '../mocks/call-utils.mocks';
import {mockLocalIcRootKey} from '../mocks/custom-http-agent-responses.mocks';
import {decodeCallRequest} from './agentjs-cbor-copy.utils';
import * as callUtils from './call.assert.utils';
import {assertCallResponse, decodeResponse} from './call.utils';

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
  describe('assertCallResponse', () => {
    let spyAssertCallMethod: MockInstance;
    let spyAssertCallCanisterId: MockInstance;
    let spyAssertCallArg: MockInstance;
    let spyAssertCallSender: MockInstance;

    beforeEach(() => {
      spyAssertCallMethod = vi.spyOn(callUtils, 'assertCallMethod');
      spyAssertCallCanisterId = vi.spyOn(callUtils, 'assertCallCanisterId');
      spyAssertCallArg = vi.spyOn(callUtils, 'assertCallArg');
      spyAssertCallSender = vi.spyOn(callUtils, 'assertCallSender');
    });

    it('should validate a valid response', () => {
      expect(() =>
        assertCallResponse({
          params: mockLocalCallParams,
          result: mockLocalCallResult
        })
      ).not.toThrow();
    });

    it('should call assertCallMethod with correct params', () => {
      assertCallResponse({
        params: mockLocalCallParams,
        result: mockLocalCallResult
      });

      const callRequest = decodeCallRequest(mockLocalCallResult.contentMap);

      expect(spyAssertCallMethod).toHaveBeenCalledWith({
        requestMethod: mockLocalCallParams.method,
        responseMethod: callRequest.method_name
      });
    });

    it('should call assertCallCanisterId with correct params', () => {
      assertCallResponse({
        params: mockLocalCallParams,
        result: mockLocalCallResult
      });

      const callRequest = decodeCallRequest(mockLocalCallResult.contentMap);

      expect(spyAssertCallCanisterId).toHaveBeenCalledWith({
        requestCanisterId: Principal.fromText(mockLocalCallParams.canisterId),
        responseCanisterId: callRequest.canister_id
      });
    });

    it('should call assertCallArg with correct params', () => {
      assertCallResponse({
        params: mockLocalCallParams,
        result: mockLocalCallResult
      });

      const callRequest = decodeCallRequest(mockLocalCallResult.contentMap);

      expect(spyAssertCallArg).toHaveBeenCalledWith({
        requestArg: mockLocalCallParams.arg,
        responseArg: callRequest.arg
      });
    });

    it('should call assertCallSender with correct params', () => {
      assertCallResponse({
        params: mockLocalCallParams,
        result: mockLocalCallResult
      });

      const callRequest = decodeCallRequest(mockLocalCallResult.contentMap);

      expect(spyAssertCallSender).toHaveBeenCalledWith({
        requestSender: mockLocalCallParams.sender,
        responseSender: callRequest.sender
      });
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
