import * as httpAgent from '@dfinity/agent';
import {Ed25519KeyIdentity} from '@dfinity/identity';
import {SignerOptions} from 'src/types/signer-options';
import {
  mockLocalIcRootKey,
  mockRepliedLocalCallTime
} from '../mocks/custom-http-agent-responses.mocks';
import {HttpAgentProvider} from './http-agent-provider';

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

  it('should create a HttpAgentProvider with the shouldFetchRootKey in options', async () => {
    const agentOptions = {shouldFetchRootKey: true};
    const spyCreate = vi.spyOn(httpAgent.HttpAgent, 'create');
    const agent = await HttpAgentProvider.create(agentOptions);
    expect(spyCreate).toHaveBeenCalledWith(agentOptions);
    expect(agent).toBeInstanceOf(HttpAgentProvider);
  });

  it('should create a HttpAgentProvider with the HttpAgentOptions', async () => {
    const agentOptions: SignerOptions = {
      owner: Ed25519KeyIdentity.generate(),
      host: 'http://localhost:8080'
    };
    const spyCreate = vi.spyOn(httpAgent.HttpAgent, 'create');
    const agent = await HttpAgentProvider.create(agentOptions);
    expect(spyCreate).toHaveBeenCalledWith(agentOptions);
    expect(agent).toBeInstanceOf(HttpAgentProvider);
  });

  it('should expose the wrapped agent', async () => {
    const agent = await HttpAgentProvider.create({});
    expect(agent.agent).toBeDefined();
    expect(agent.agent).toBeInstanceOf(httpAgent.HttpAgent);
  });

  it('should call HttpAgent.create once with the provided options', async () => {
    const agentOptions = {shouldFetchRootKey: true};

    await HttpAgentProvider.create(agentOptions);

    expect(httpAgent.HttpAgent.create).toHaveBeenCalledOnce();

    expect(httpAgent.HttpAgent.create).toHaveBeenCalledWith(agentOptions);
  });
});
