import {Expiry, HttpAgentSubmitRequest} from '@dfinity/agent';
import {base64ToUint8Array} from '@dfinity/utils';
import {describe, expect, it, vi} from 'vitest';
import {createMockRequest, mockRequestPayload} from '../mocks/custom-http-agent.mocks';
import {customAddTransform} from './custrom-transform-agent';

vi.mock('@dfinity/agent', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@dfinity/agent')>();

  class MockHttpAgent {
    addTransform = vi.fn();
    call = vi.fn();
  }

  Object.defineProperty(MockHttpAgent, 'create', {
    value: vi.fn().mockResolvedValue(new MockHttpAgent()),
    writable: true
  });

  return {
    ...actual,
    HttpAgent: MockHttpAgent
  };
});

describe('customAddTransform integration with HttpAgent', () => {
  it('should register transform before making a call', async () => {
    const {HttpAgent} = await import('@dfinity/agent');
    const agent = await HttpAgent.create();
    const spyCall = vi.spyOn(agent, 'call');
    const spyTransform = vi.spyOn(agent, 'addTransform');
    const transform = customAddTransform();
    agent.addTransform('update', transform);

    const callOptions = {
      methodName: mockRequestPayload.method,
      arg: new Uint8Array(base64ToUint8Array(mockRequestPayload.arg)).buffer,
      effectiveCanisterId: mockRequestPayload.canisterId,
      nonce: new Uint8Array([9, 9, 9])
    };

    await agent.call(mockRequestPayload.canisterId, callOptions);

    expect(spyTransform).toHaveBeenCalledOnce();
    expect(spyTransform).toHaveBeenCalledWith('update', expect.any(Function));
    expect(spyCall).toHaveBeenCalledOnce();
    expect(spyCall).toHaveBeenCalledWith(mockRequestPayload.canisterId, callOptions);
  });
});

describe('customAddTransform core logic', () => {
  it('returns request if nonce is not present (and no ingress_expiry)', async () => {
    const mockRequest = createMockRequest({});
    const transform = customAddTransform();
    const result = await transform(mockRequest as unknown as HttpAgentSubmitRequest);

    expect(result!.body).not.toHaveProperty('ingress_expiry');
    expect(result).toEqual(mockRequest);
  });

  it('should add ingress_expiry to cache if it does not exist and use cache for subsequent calls', async () => {
    const ingress_expiry = new Expiry(5000);
    const mockRequest = createMockRequest({ingress_expiry, nonce: new Uint8Array([9, 9, 9])});
    const transform = customAddTransform();

    const firstResult = await transform(mockRequest as unknown as HttpAgentSubmitRequest);

    expect(firstResult!.body.ingress_expiry).toEqual(ingress_expiry);

    const secondResult = await transform(mockRequest as unknown as HttpAgentSubmitRequest);

    expect(secondResult!.body.ingress_expiry).toEqual(ingress_expiry);
  });

  it('should cache and re-use ingress_expiry if same hash', async () => {
    const expiry1 = new Expiry(5000);
    const expiry2 = new Expiry(10000);
    const mockRequest1 = createMockRequest({
      ingress_expiry: expiry1,
      nonce: new Uint8Array([1, 1, 1])
    });
    const mockRequest2 = createMockRequest({
      ingress_expiry: expiry2,
      nonce: new Uint8Array([1, 1, 1])
    });

    const transform = customAddTransform();

    const result1 = await transform(mockRequest1 as unknown as HttpAgentSubmitRequest);

    expect(result1!.body.ingress_expiry).toEqual(expiry1);

    const result2 = await transform(mockRequest2 as unknown as HttpAgentSubmitRequest);

    expect(result2!.body.ingress_expiry).toEqual(expiry1);
  });

  it('throws if cached expiry is older than now', async () => {
    const expired = new Expiry(-1000);
    const mockRequest = createMockRequest({
      ingress_expiry: expired,
      nonce: new Uint8Array([1, 1, 1])
    });

    const mockCurrentTime = BigInt(Date.now() * 1_000_000);
    vi.mock('@dfinity/utils', () => ({
      ...vi.importActual('@dfinity/utils'),
      nowInBigIntNanoSeconds: vi.fn(() => mockCurrentTime)
    }));

    const transform = customAddTransform();

    await expect(transform(mockRequest as unknown as HttpAgentSubmitRequest)).rejects.toThrow(
      'Ingress Expiry has been expired.'
    );
  });
});
