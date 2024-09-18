import type {RequestId, SubmitResponse} from '@dfinity/agent';
import * as httpAgent from '@dfinity/agent';
import {SubmitRequestType, type CallRequest} from '@dfinity/agent/lib/cjs/agent/http/types';
import {Principal} from '@dfinity/principal';
import type {MockInstance} from 'vitest';
import {
  mockLocalIcRootKey,
  mockRejectedLocalCallTime,
  mockRejectedLocalCertificate,
  mockRejectedLocalRequestId,
  mockRepliedLocalCallTime,
  mockRepliedLocalCertificate,
  mockRepliedLocalRequestId
} from '../mocks/custom-http-agent.mocks';
import {mockCanisterId, mockPrincipalText} from '../mocks/icrc-accounts.mocks';
import {base64ToUint8Array, uint8ArrayToBase64} from '../utils/base64.utils';
import {
  CustomHttpAgent,
  InvalidCertificateReplyError,
  RequestError,
  UndefinedRequestDetailsError
} from './custom-http-agent';

vi.mock('@dfinity/agent', async (importOriginal) => {
  // eslint-disable-next-line @typescript-eslint/consistent-type-imports
  const originalModule = await importOriginal<typeof import('@dfinity/agent')>();

  class MockHttpAgent {
    call = vi.fn();

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

describe('CustomHttpAgent', () => {
  const mockMethod = 'test-method';

  const mockRequestPayload = {
    arg: uint8ArrayToBase64(new Uint8Array([1, 2, 3, 4])),
    canisterId: mockCanisterId,
    method: mockMethod
  };

  const mockRequestDetails: CallRequest = {
    arg: new Uint8Array([68, 73, 68, 76, 6, 109, 123, 110, 0, 108]),
    canister_id: Principal.fromText(mockCanisterId),
    ingress_expiry: expect.anything(),
    method_name: mockMethod,
    nonce: expect.anything(),
    request_type: SubmitRequestType.Call,
    sender: Principal.fromText(mockPrincipalText)
  };

  const mockResponse: SubmitResponse['response'] = {
    body: null,
    headers: [
      ['content-length', '599'],
      ['content-type', 'application/cbor']
    ],
    ok: true,
    status: 202,
    statusText: 'OK'
  };

  const mockSubmitRestResponse: Omit<SubmitResponse, 'requestDetails'> = {
    requestId: mockRepliedLocalRequestId.buffer as RequestId,
    response: mockResponse
  };

  const mockSubmitResponse: SubmitResponse = {
    requestDetails: mockRequestDetails,
    ...mockSubmitRestResponse
  };

  beforeEach(() => {
    vi.setSystemTime(mockRepliedLocalCallTime);
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  it('should create a CustomHttpAgent with the correct options', async () => {
    const agentOptions = {shouldFetchRootKey: true};
    const agent = await CustomHttpAgent.create(agentOptions);
    expect(agent).toBeInstanceOf(CustomHttpAgent);
  });

  it('should expose the wrapped agent', async () => {
    const agent = await CustomHttpAgent.create({});
    expect(agent.agent).toBeDefined();
    expect(agent.agent).toBeInstanceOf(httpAgent.HttpAgent);
  });

  describe('Success call', () => {
    let spyCall: MockInstance;
    let agent: CustomHttpAgent;
    let certificate: httpAgent.Certificate;

    beforeEach(async () => {
      agent = await CustomHttpAgent.create();

      certificate = await httpAgent.Certificate.create({
        certificate: httpAgent.fromHex(mockRepliedLocalCertificate),
        canisterId: mockRequestDetails.canister_id,
        rootKey: mockLocalIcRootKey.buffer
      });
    });

    describe('API v3 / certificate is defined', () => {
      describe('Replied (success) response', () => {
        beforeEach(() => {
          const mockBody = {
            certificate: httpAgent.fromHex(mockRepliedLocalCertificate),
            status: 'replied'
          };

          spyCall = vi.spyOn(agent.agent, 'call').mockResolvedValue({
            requestDetails: mockRequestDetails,
            ...mockSubmitRestResponse,
            response: {
              ...mockResponse,
              // @ts-expect-error: Agent-js is not typed correctly.
              body: mockBody
            },
            requestId: mockRepliedLocalRequestId.buffer as RequestId
          });
        });

        it('should call agent on request', async () => {
          await agent.request(mockRequestPayload);

          expect(spyCall).toHaveBeenCalledTimes(1);
          expect(spyCall).toHaveBeenCalledWith(mockCanisterId, {
            arg: base64ToUint8Array(mockRequestPayload.arg),
            effectiveCanisterId: mockCanisterId,
            methodName: mockMethod
          });
        });

        it('should make a request and return a certificate and request details', async () => {
          const response = await agent.request(mockRequestPayload);

          expect(response.certificate).toEqual(certificate);
          expect(response.requestDetails).toEqual(mockRequestDetails);
        });
      });

      describe('Invalid response', () => {
        it('should throw UndefinedRequestDetailsError if requestDetails is null', async () => {
          spyCall.mockResolvedValue({
            ...mockSubmitRestResponse,
            requestDetails: null
          });

          await expect(agent.request(mockRequestPayload)).rejects.toThrow(
            UndefinedRequestDetailsError
          );
        });

        it('should bubble error if bufFromBufLike returns invalid buffer', async () => {
          spyCall.mockResolvedValue({
            ...mockSubmitRestResponse,
            requestDetails: mockRequestDetails,
            response: {
              ...mockResponse,
              body: {
                certificate: 'invalid-certificate'
              }
            }
          });

          await expect(agent.request(mockRequestPayload)).rejects.toThrow();
        });

        it('should bubble error if body does not contain certificate in readResponse', async () => {
          spyCall.mockResolvedValue({
            ...mockSubmitRestResponse,
            requestDetails: mockRequestDetails,
            response: {
              ...mockResponse,
              body: {}
            }
          });

          await expect(agent.request(mockRequestPayload)).rejects.toThrow();
        });

        it('should throw InvalidCertificateReplyError if Certificate.create throws an error', async () => {
          spyCall.mockResolvedValue({
            ...mockSubmitRestResponse,
            requestDetails: mockRequestDetails,
            response: {
              ...mockResponse,
              body: {
                certificate: httpAgent.fromHex(mockRepliedLocalCertificate)
              }
            }
          });

          const spy = vi
            .spyOn(httpAgent.Certificate, 'create')
            .mockRejectedValue(new Error('Invalid certificate'));

          await expect(agent.request(mockRequestPayload)).rejects.toThrow('Invalid certificate');

          spy.mockRestore();
        });
      });

      describe('Rejected response', () => {
        const mockBody = {
          certificate: httpAgent.fromHex(mockRejectedLocalCertificate),
          status: 'rejected'
        };

        let mockCallSubmitResponse: Omit<SubmitResponse, 'requestId'> = {
          requestDetails: mockRequestDetails,
          ...mockSubmitRestResponse,
          response: {
            ...mockResponse,
            // @ts-expect-error: Agent-js is not typed correctly.
            body: mockBody
          }
        };

        beforeEach(() => {
          vi.setSystemTime(mockRejectedLocalCallTime);
        });

        it('should throw an error if the certificate is rejected', async () => {
          spyCall = vi.spyOn(agent.agent, 'call').mockResolvedValue({
            ...mockCallSubmitResponse,
            requestId: mockRejectedLocalRequestId.buffer as RequestId
          });

          await expect(agent.request(mockRequestPayload)).rejects.toThrow(
            InvalidCertificateReplyError
          );
        });

        // TODO: we need a test that assert InvalidCertificateReplyError is throw when the certificate matches an unknown status

        it('should throw an InvalidCertificateReplyError if no request ID is present in response', async () => {
          // @ts-expect-error: we are testing this on purpose
          spyCall = vi.spyOn(agent.agent, 'call').mockResolvedValue(mockCallSubmitResponse);

          await expect(agent.request(mockRequestPayload)).rejects.toThrow(
            InvalidCertificateReplyError
          );
        });
      });
    });

    describe('API v2 / pollForResponse', () => {
      let spyPollForResponse: MockInstance;

      beforeEach(async () => {
        spyCall = vi.spyOn(agent.agent, 'call').mockResolvedValue(mockSubmitResponse);
      });

      describe('Success', () => {
        beforeEach(async () => {
          spyPollForResponse = vi.spyOn(httpAgent, 'pollForResponse').mockResolvedValue({
            certificate,
            reply: expect.anything()
          });
        });

        describe('Valid response', () => {
          it('should call agent on request', async () => {
            await agent.request(mockRequestPayload);

            expect(spyCall).toHaveBeenCalledTimes(1);
            expect(spyCall).toHaveBeenCalledWith(mockCanisterId, {
              arg: base64ToUint8Array(mockRequestPayload.arg),
              effectiveCanisterId: mockCanisterId,
              methodName: mockMethod
            });
          });

          it('should make a request and return a certificate and request details', async () => {
            const response = await agent.request(mockRequestPayload);

            expect(response.certificate).toEqual(certificate);
            expect(response.requestDetails).toEqual(mockRequestDetails);
          });

          it('should poll for response when status is 202 and no certificate is returned by v3 call', async () => {
            await agent.request(mockRequestPayload);

            expect(spyPollForResponse).toHaveBeenCalledTimes(1);
          });
        });

        describe('Invalid response', () => {
          it('should throw UndefinedRequestDetailsError if requestDetails is null', async () => {
            spyCall.mockResolvedValue({
              ...mockSubmitRestResponse,
              requestDetails: null
            });

            await expect(agent.request(mockRequestPayload)).rejects.toThrow(
              UndefinedRequestDetailsError
            );
          });

          it('should throw RequestError if status is not 202', async () => {
            spyCall.mockResolvedValue({
              ...mockSubmitResponse,
              response: {
                ...mockSubmitRestResponse.response,
                status: 500
              }
            });

            await expect(agent.request(mockRequestPayload)).rejects.toThrow(RequestError);
          });

          it('should throw RequestError even if status is 200', async () => {
            spyCall.mockResolvedValue({
              ...mockSubmitResponse,
              response: {
                ...mockSubmitRestResponse.response,
                status: 200
              }
            });

            await expect(agent.request(mockRequestPayload)).rejects.toThrow(RequestError);
          });
        });
      });

      describe('Success but invalid response', () => {
        beforeEach(async () => {
          spyPollForResponse = vi.spyOn(httpAgent, 'pollForResponse').mockResolvedValue({
            // @ts-expect-error: we are testing this on purpose
            certificate: null,
            // @ts-expect-error: we are testing this on purpose
            reply: null
          });
        });

        it('should bubble the error if pollForResponse returns an invalid certificate', async () => {
          spyCall.mockResolvedValue({
            ...mockSubmitRestResponse,
            response: {
              ...mockResponse,
              status: 202
            }
          });

          await expect(agent.request(mockRequestPayload)).rejects.toThrow();
        });
      });

      describe('Error', () => {
        beforeEach(async () => {
          spyPollForResponse = vi
            .spyOn(httpAgent, 'pollForResponse')
            .mockRejectedValue(new Error('Polling error'));
        });

        it('should bubble error if pollForResponse rejects', async () => {
          spyCall.mockResolvedValue(mockSubmitResponse);

          await expect(agent.request(mockRequestPayload)).rejects.toThrow('Polling error');
        });
      });
    });
  });

  it('should throw an error if the arguments are not well formatted', async () => {
    const agent = await CustomHttpAgent.create();
    await expect(
      agent.request({
        arg: 'base64-encoded-argument',
        canisterId: mockCanisterId,
        method: mockMethod
      })
    ).rejects.toThrow('Invalid character');
  });
});
