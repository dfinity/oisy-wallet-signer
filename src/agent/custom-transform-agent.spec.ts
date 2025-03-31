import {Expiry, HttpAgentSubmitRequest} from '@dfinity/agent';
import {nonNullish} from '@dfinity/utils';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {createMockRequest, mockRequestPayload} from '../mocks/custom-http-agent.mocks';
import {customAddTransform} from './custom-transform-agent';

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

vi.mock('@dfinity/utils', async () => {
  const actual = await vi.importActual('@dfinity/utils');

  return {
    ...actual,
    nowInBigIntNanoSeconds: vi.fn(() => BigInt(Date.now()) * BigInt(1_000_000))
  };
});

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
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
      arg: new Uint8Array([68, 73, 68, 76, 6, 109, 123, 110, 0, 108]).buffer,
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
  it('throws if cached expiry is older than now', async () => {
    const ingress_expiry = new Expiry(1);
    const mockRequest = createMockRequest({ingress_expiry, nonce: new Uint8Array([9, 9, 9])});
    const transform = customAddTransform();

    const firstResult = await transform(mockRequest as unknown as HttpAgentSubmitRequest);

    if (nonNullish(firstResult?.body?.ingress_expiry)) {
      expect(firstResult.body.ingress_expiry).toEqual(ingress_expiry);
    }

    await expect(transform(mockRequest as unknown as HttpAgentSubmitRequest)).rejects.toThrow(
      'Ingress Expiry has been expired.'
    );
  });

  it('should cache and re-use ingress_expiry if same hash', async () => {
    const expiry1 = new Expiry(5 * 60 * 1000);
    const expiry2 = new Expiry(5 * 60 * 1000);
    const mockRequest1 = createMockRequest({
      ingress_expiry: expiry1,
      nonce: new Uint8Array([1, 1, 1])
    });
    const mockRequest2 = createMockRequest({
      ingress_expiry: expiry2,
      nonce: new Uint8Array([1, 1, 1])
    });

    const transform = customAddTransform();

    const firstResult = await transform(mockRequest1 as unknown as HttpAgentSubmitRequest);

    if (nonNullish(firstResult?.body?.ingress_expiry)) {
      expect(firstResult.body.ingress_expiry).toEqual(expiry1);
    }

    const secondResult = await transform(mockRequest2 as unknown as HttpAgentSubmitRequest);

    if (nonNullish(secondResult?.body?.ingress_expiry)) {
      expect(secondResult.body.ingress_expiry).toEqual(expiry1);
    }
  });

  it('should add ingress_expiry to cache if it does not exist and use cache for subsequent calls', async () => {
    const ingress_expiry = new Expiry(5 * 60 * 1000);
    const mockRequest = createMockRequest({ingress_expiry, nonce: new Uint8Array([9, 9, 9])});
    const transform = customAddTransform();

    const firstResult = await transform(mockRequest as unknown as HttpAgentSubmitRequest);

    if (nonNullish(firstResult?.body?.ingress_expiry)) {
      expect(firstResult.body.ingress_expiry).toEqual(ingress_expiry);
    }

    const secondResult = await transform(mockRequest as unknown as HttpAgentSubmitRequest);

    if (nonNullish(secondResult?.body?.ingress_expiry)) {
      expect(secondResult.body.ingress_expiry).toEqual(ingress_expiry);
    }
  });
});
