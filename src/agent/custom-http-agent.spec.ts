import * as httpAgent from '@dfinity/agent';
import {Certificate, fromHex, IC_ROOT_KEY, type SubmitResponse} from '@dfinity/agent';
import {SubmitRequestType, type CallRequest} from '@dfinity/agent/lib/cjs/agent/http/types';
import {Principal} from '@dfinity/principal';
import type {MockInstance} from 'vitest';
import {mockLocalApplicationCertificate} from '../mocks/custom-http-agent.mocks';
import {mockCanisterId, mockPrincipalText} from '../mocks/icrc-accounts.mocks';
import {base64ToUint8Array, uint8ArrayToBase64} from '../utils/base64.utils';
import {CustomHttpAgent, RequestError, UndefinedRequestDetailsError} from './custom-http-agent';

vi.mock('@dfinity/agent', async (importOriginal) => {
  // eslint-disable-next-line @typescript-eslint/consistent-type-imports
  const originalModule = await importOriginal<typeof import('@dfinity/agent')>();

  class MockHttpAgent {
    call = vi.fn();
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

  const mockRestResponse: Omit<SubmitResponse, 'requestDetails'> = {
    requestId: expect.anything(),
    response: {
      body: null,
      headers: [
        ['content-length', '599'],
        ['content-type', 'application/cbor']
      ],
      ok: true,
      status: 202,
      statusText: 'OK'
    }
  };

  const mockResponse: SubmitResponse = {
    requestDetails: mockRequestDetails,
    ...mockRestResponse
  };

  beforeEach(() => {
    vi.setSystemTime(new Date(Date.parse('2023-09-27T20:14:59.406Z')));
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  it('should create a CustomHttpAgent with the correct options', async () => {
    const agentOptions = {shouldFetchRootKey: true};
    const agent = await CustomHttpAgent.create(agentOptions);
    expect(agent).toBeInstanceOf(CustomHttpAgent);
    expect(agent.agent).toBeInstanceOf(httpAgent.HttpAgent);
  });

  describe('Success call', () => {
    let spyCall: MockInstance;
    let spyPollForResponse: MockInstance;
    let agent: CustomHttpAgent;
    let certificate: Certificate;

    beforeEach(async () => {
      agent = await CustomHttpAgent.create();

      spyCall = vi.spyOn(agent.agent, 'call').mockResolvedValue(mockResponse);

      certificate = await Certificate.create({
        certificate: fromHex(mockLocalApplicationCertificate),
        canisterId: mockRequestDetails.canister_id,
        rootKey: fromHex(IC_ROOT_KEY)
      });

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
          ...mockRestResponse,
          requestDetails: null
        });

        await expect(agent.request(mockRequestPayload)).rejects.toThrow(
          UndefinedRequestDetailsError
        );
      });

      it('should throw RequestError if status is not 202', async () => {
        spyCall.mockResolvedValue({
          ...mockResponse,
          response: {
            ...mockRestResponse.response,
            status: 500
          }
        });

        await expect(agent.request(mockRequestPayload)).rejects.toThrow(RequestError);
      });

      it('should throw RequestError even if status is 200', async () => {
        spyCall.mockResolvedValue({
          ...mockResponse,
          response: {
            ...mockRestResponse.response,
            status: 200
          }
        });

        await expect(agent.request(mockRequestPayload)).rejects.toThrow(RequestError);
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
