import * as httpAgent from '@dfinity/agent';
import {
  mockLocalIcRootKey,
  mockRepliedLocalCallTime
} from '../mocks/custom-http-agent-responses.mocks';
import {CustomHttpAgent} from './custom-http-agent';

vi.mock('@dfinity/agent', async (importOriginal) => {
  const originalModule = await importOriginal<typeof import('@dfinity/agent')>();

  class MockHttpAgent {
    call = vi.fn();
    create = vi.fn();
    addTransform = vi.fn();

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

describe('Http-Agent-Provider', () => {
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

    expect(httpAgent.HttpAgent.create).toHaveBeenCalledOnce();

    expect(httpAgent.HttpAgent.create).toHaveBeenCalledWith(agentOptions);
  });
});
