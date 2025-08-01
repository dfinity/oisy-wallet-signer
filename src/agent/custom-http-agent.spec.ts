import type {RequestId, SubmitResponse} from '@dfinity/agent';
import * as httpAgent from '@dfinity/agent';
import {Ed25519KeyIdentity} from '@dfinity/identity';
import {base64ToUint8Array, hexStringToUint8Array, nonNullish} from '@dfinity/utils';
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
  mockRequestPayload,
  mockRequestPayloadWithNonce
} from '../mocks/custom-http-agent.mocks';
import {mockCanisterId} from '../mocks/icrc-accounts.mocks';
import {
  CustomHttpAgent,
  InvalidCertificateReplyError,
  InvalidCertificateStatusError,
  RequestError,
  UndefinedRequestDetailsError,
  UndefinedRootKeyError
} from './custom-http-agent';
import * as transformAgent from './custom-transform-agent';

vi.mock('@dfinity/agent', async (importOriginal) => {
  const originalModule = await importOriginal<typeof httpAgent>();

  class MockHttpAgent {
    call = vi.fn();
    create = vi.fn();
    addTransform = vi.fn();

    get rootKey(): Uint8Array {
      return mockLocalIcRootKey;
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
    requestId: mockRepliedLocalRequestId as RequestId,
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

  it('should call customAddTransform in the constructor', async () => {
    const spyCustomAddTransform = vi.spyOn(transformAgent, 'customAddTransform');

    const agent = await CustomHttpAgent.create();

    expect(agent).toBeInstanceOf(CustomHttpAgent);

    expect(spyCustomAddTransform).toHaveBeenCalledOnce();

    spyCustomAddTransform.mockRestore();
  });

  it('should create a CustomHttpAgent with the correct options', async () => {
    const agentOptions = {
      owner: Ed25519KeyIdentity.generate(),
      host: 'http://localhost:8080',
      shouldFetchRootKey: true
    };

    const spyCreate = vi.spyOn(httpAgent.HttpAgent, 'create');
    const customAgent = await CustomHttpAgent.create(agentOptions);

    expect(spyCreate).toHaveBeenCalledWith(agentOptions);

    expect(customAgent).toBeInstanceOf(CustomHttpAgent);
  });

  it('should expose the wrapped agent', async () => {
    const customAgent = await CustomHttpAgent.create({});

    expect(customAgent.agent).toBeDefined();
    expect(customAgent.agent).toBeInstanceOf(httpAgent.HttpAgent);
  });

  it('should call HttpAgent.create once with the provided options', async () => {
    const agentOptions = {shouldFetchRootKey: true};

    await CustomHttpAgent.create(agentOptions);

    expect(httpAgent.HttpAgent.create).toHaveBeenCalledOnce();

    expect(httpAgent.HttpAgent.create).toHaveBeenCalledWith(agentOptions);
  });

  describe('Success call', () => {
    let spyCall: MockInstance;
    let agent: CustomHttpAgent;
    let certificate: httpAgent.Certificate;

    beforeEach(async () => {
      agent = await CustomHttpAgent.create();

      certificate = await httpAgent.Certificate.create({
        certificate: hexStringToUint8Array(mockRepliedLocalCertificate),
        canisterId: mockRequestDetails.canister_id,
        rootKey: mockLocalIcRootKey
      });
    });

    describe('API v3 / certificate is defined', () => {
      const mockRepliedBody = {
        certificate: hexStringToUint8Array(mockRepliedLocalCertificate),
        status: 'replied'
      };

      const mockRepliedSubmitResponse: SubmitResponse = {
        requestDetails: mockRequestDetails,
        ...mockSubmitRestResponse,
        response: {
          ...mockResponse,
          body: mockRepliedBody
        },
        requestId: mockRepliedLocalRequestId as RequestId
      };

      describe('Replied (success) response', () => {
        beforeEach(() => {
          spyCall = vi.spyOn(agent.agent, 'call').mockResolvedValue(mockRepliedSubmitResponse);
        });

        it('should call agent on request without nonce', async () => {
          await agent.request(mockRequestPayload);

          expect(spyCall).toHaveBeenCalledOnce();
          expect(spyCall).toHaveBeenCalledWith(mockCanisterId, {
            arg: base64ToUint8Array(mockRequestPayload.arg),
            effectiveCanisterId: mockCanisterId,
            methodName: mockRequestMethod
          });
        });

        it('should call agent on request with nonce', async () => {
          await agent.request(mockRequestPayloadWithNonce);

          const mockedNonce =
            nonNullish(mockRequestPayloadWithNonce.nonce) &&
            base64ToUint8Array(mockRequestPayloadWithNonce.nonce);

          expect(spyCall).toHaveBeenCalledOnce();
          expect(spyCall).toHaveBeenCalledWith(mockCanisterId, {
            arg: base64ToUint8Array(mockRequestPayload.arg),
            effectiveCanisterId: mockCanisterId,
            methodName: mockRequestMethod,
            nonce: mockedNonce
          });
        });

        it('should make a request and return a certificate and request details', async () => {
          const response = await agent.request(mockRequestPayload);

          expect(response.certificate).toEqual(certificate);
          expect(response.requestDetails).toEqual(mockRequestDetails);
        });

        it('should make a request with nonce and return a certificate and request details', async () => {
          const response = await agent.request(mockRequestPayloadWithNonce);

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
                certificate: hexStringToUint8Array(mockRepliedLocalCertificate)
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
          certificate: hexStringToUint8Array(mockRejectedLocalCertificate),
          status: 'rejected'
        };

        const mockCallSubmitResponse: Omit<SubmitResponse, 'requestId'> = {
          requestDetails: mockRequestDetails,
          ...mockSubmitRestResponse,
          response: {
            ...mockResponse,
            body: mockBody
          }
        };

        beforeEach(() => {
          vi.setSystemTime(mockRejectedLocalCallTime);
        });

        it('should throw an error if the certificate is rejected', async () => {
          spyCall = vi.spyOn(agent.agent, 'call').mockResolvedValue({
            ...mockCallSubmitResponse,
            requestId: mockRejectedLocalRequestId as RequestId
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

      it('should throw an exception if the agent root key is not defined', async () => {
        vi.spyOn(agent.agent, 'rootKey', 'get').mockReturnValue(null);

        await expect(agent.request(mockRequestPayload)).rejects.toThrow(UndefinedRootKeyError);
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
          it('should call agent on request without nonce', async () => {
            await agent.request(mockRequestPayload);

            expect(spyCall).toHaveBeenCalledOnce();
            expect(spyCall).toHaveBeenCalledWith(mockCanisterId, {
              arg: base64ToUint8Array(mockRequestPayload.arg),
              effectiveCanisterId: mockCanisterId,
              methodName: mockRequestMethod
            });
          });

          it('should call agent on request with nonce', async () => {
            await agent.request(mockRequestPayloadWithNonce);

            const mockedNonce =
              nonNullish(mockRequestPayloadWithNonce.nonce) &&
              base64ToUint8Array(mockRequestPayloadWithNonce.nonce);

            expect(spyCall).toHaveBeenCalledOnce();
            expect(spyCall).toHaveBeenCalledWith(mockCanisterId, {
              arg: base64ToUint8Array(mockRequestPayload.arg),
              effectiveCanisterId: mockCanisterId,
              methodName: mockRequestMethod,
              nonce: mockedNonce
            });
          });

          it('should make a request and return a certificate and request details', async () => {
            const response = await agent.request(mockRequestPayload);

            expect(response.certificate).toEqual(certificate);
            expect(response.requestDetails).toEqual(mockRequestDetails);
          });

          it('should poll for response when status is 202 and no certificate is returned by v3 call', async () => {
            await agent.request(mockRequestPayload);

            expect(spyPollForResponse).toHaveBeenCalledOnce();
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
