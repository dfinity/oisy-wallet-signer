import * as httpAgent from '@dfinity/agent';
import {Certificate, fromHex, IC_ROOT_KEY, SubmitResponse} from '@dfinity/agent';
import {CallRequest, SubmitRequestType} from '@dfinity/agent/lib/cjs/agent/http/types';
import {Principal} from '@dfinity/principal';
import {afterEach, beforeEach, describe, MockInstance, vi} from 'vitest';
import {mockLocalApplicationCertificate} from '../mocks/custom-http-agent.mocks';
import {mockCanisterId, mockPrincipalText} from '../mocks/icrc-accounts.mocks';
import {uint8ArrayToBase64} from '../utils/base64.utils';
import {CustomHttpAgent} from './custom-http-agent';

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
      status: 200,
      statusText: 'OK'
    }
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
    let agent: CustomHttpAgent;

    beforeEach(async () => {
      agent = await CustomHttpAgent.create();

      spyCall = vi.spyOn(agent.agent, 'call').mockResolvedValue({
        requestDetails: mockRequestDetails,
        ...mockRestResponse
      });

      const certificate = await Certificate.create({
        certificate: fromHex(mockLocalApplicationCertificate),
        canisterId: mockRequestDetails.canister_id,
        rootKey: fromHex(IC_ROOT_KEY)
      });

      vi.spyOn(httpAgent, 'pollForResponse').mockResolvedValue({
        certificate,
        reply: expect.anything()
      });
    });

    it('should call agent on request', async () => {
      await agent.request({
        arg: uint8ArrayToBase64(new Uint8Array([1, 2, 3, 4])),
        canisterId: mockCanisterId,
        method: mockMethod
      });

      expect(spyCall).toHaveBeenCalledTimes(1);
    });

    it.skip('should make a valid request and return a valid certificate', async () => {
      const response = await agent.request({
        arg: uint8ArrayToBase64(new Uint8Array([1, 2, 3, 4])),
        canisterId: mockCanisterId,
        method: mockMethod
      });

      expect(response).toHaveProperty('certificate');
      expect(response).toHaveProperty('requestDetails');
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
