import type {RequestId, SubmitResponse} from '@dfinity/agent';
import * as httpAgent from '@dfinity/agent';
import type {MockInstance} from 'vitest';
import {
  mockLocalIcRootKey,
  mockRejectedLocalCallTime,
  mockRejectedLocalCertificate,
  mockRejectedLocalRequestId,
  mockRepliedLocalCallTime,
  mockRepliedLocalCertificate,
  mockRepliedLocalRequestId
} from '../mocks/custom-http-agent-responses.mocks';
import {
  mockRequestDetails,
  mockRequestMethod,
  mockRequestPayload
} from '../mocks/custom-http-agent.mocks';
import {mockCanisterId} from '../mocks/icrc-accounts.mocks';
import {base64ToUint8Array} from '../utils/base64.utils';
import {
  CustomHttpAgent,
  InvalidCertificateReplyError,
  InvalidCertificateStatusError,
  RequestError,
  UndefinedRequestDetailsError
} from './custom-http-agent';

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

describe('CustomHttpAgent', () => {
  const mockResponse: SubmitResponse['response'] = {
    body: null,
    headers: [
      ['content-length', '599'],
      ['content-type', 'application/cbor']
    ],
    ok: true,
    status: 200,
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

  it('should call HttpAgent.create once with the provided options', async () => {
    const agentOptions = {shouldFetchRootKey: true};

    await CustomHttpAgent.create(agentOptions);

    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(httpAgent.HttpAgent.create).toHaveBeenCalledTimes(1);
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(httpAgent.HttpAgent.create).toHaveBeenCalledWith(agentOptions);
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
      const mockRepliedBody = {
        certificate: httpAgent.fromHex(mockRepliedLocalCertificate),
        status: 'replied'
      };

      const mockRepliedSubmitResponse: SubmitResponse = {
        requestDetails: mockRequestDetails,
        ...mockSubmitRestResponse,
        response: {
          ...mockResponse,
          // @ts-expect-error: Agent-js is not typed correctly.
          body: mockRepliedBody
        },
        requestId: mockRepliedLocalRequestId.buffer as RequestId
      };

      describe('Replied (success) response', () => {
        beforeEach(() => {
          spyCall = vi.spyOn(agent.agent, 'call').mockResolvedValue(mockRepliedSubmitResponse);
        });

        it('should call agent on request', async () => {
          await agent.request(mockRequestPayload);

          expect(spyCall).toHaveBeenCalledTimes(1);
          expect(spyCall).toHaveBeenCalledWith(mockCanisterId, {
            arg: base64ToUint8Array(mockRequestPayload.arg),
            effectiveCanisterId: mockCanisterId,
            methodName: mockRequestMethod
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

        it.each([202, 400, 500])(
          'should throw InvalidCertificateStatusError if certificate is provided with a status %s',
          async (code) => {
            spyCall.mockResolvedValue({
              ...mockRepliedSubmitResponse,
              response: {
                ...mockRepliedSubmitResponse.response,
                status: code
              }
            });

            await expect(agent.request(mockRequestPayload)).rejects.toThrow(
              InvalidCertificateStatusError
            );
          }
        );
      });

      describe('Rejected response', () => {
        const mockBody = {
          certificate: httpAgent.fromHex(mockRejectedLocalCertificate),
          status: 'rejected'
        };

        const mockCallSubmitResponse: Omit<SubmitResponse, 'requestId'> = {
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

      const mockPollSubmitResponse = {
        ...mockSubmitResponse,
        response: {
          ...mockResponse,
          status: 202
        }
      };

      beforeEach(() => {
        spyCall = vi.spyOn(agent.agent, 'call').mockResolvedValue(mockPollSubmitResponse);
      });

      describe('Success', () => {
        beforeEach(() => {
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
              methodName: mockRequestMethod
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
        beforeEach(() => {
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
        beforeEach(() => {
          spyPollForResponse = vi
            .spyOn(httpAgent, 'pollForResponse')
            .mockRejectedValue(new Error('Polling error'));
        });

        it('should bubble error if pollForResponse rejects', async () => {
          spyCall.mockResolvedValue(mockPollSubmitResponse);

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
        method: mockRequestMethod
      })
    ).rejects.toThrow('Invalid character');
  });
});
