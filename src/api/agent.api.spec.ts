import {Ed25519KeyIdentity} from '@dfinity/identity';
import {CustomHttpAgent} from '../agent/custom-http-agent';
import type {SignerOptions} from '../types/signer-options';
import {AgentApi} from './agent.api';

vi.mock('../agent/custom-http-agent', async (importOriginal) => {
  const originalModule = await importOriginal<typeof import('../agent/custom-http-agent')>();
  return {
    ...originalModule,
    CustomHttpAgent: {
      create: vi.fn().mockResolvedValue({test: 'mockCustomAgent'})
    }
  };
});

class TestAgent extends AgentApi {
  async getAgentTest(params: SignerOptions): Promise<CustomHttpAgent> {
    return await this.getAgent(params);
  }
}

describe('AgentApi', () => {
  let agentApi: TestAgent;

  const identity = Ed25519KeyIdentity.generate();

  const signerOptions: SignerOptions = {
    owner: identity,
    host: 'http://localhost:8080'
  };

  beforeEach(() => {
    agentApi = new TestAgent();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Cache', () => {
    const identity2 = Ed25519KeyIdentity.generate();

    it('should call createAgent and cache the result for the first call', async () => {
      const agent = await agentApi.getAgentTest(signerOptions);

      expect(CustomHttpAgent.create).toHaveBeenCalledWith({
        identity,
        shouldFetchRootKey: true,
        host: 'http://localhost:8080'
      });

      expect(agent).toEqual({test: 'mockCustomAgent'});

      await agentApi.getAgentTest(signerOptions);

      expect(CustomHttpAgent.create).toHaveBeenCalledOnce();
    });

    it('should create and cache a new agent for a different identity', async () => {
      await agentApi.getAgentTest(signerOptions);

      const differentSignerOptions: SignerOptions = {
        owner: identity2,
        host: 'http://localhost:8080'
      };

      const newAgent = await agentApi.getAgentTest(differentSignerOptions);

      expect(CustomHttpAgent.create).toHaveBeenCalledTimes(2);

      expect(newAgent).toEqual({test: 'mockCustomAgent'});
    });

    it('should not call createAgent if the agent is already cached for the same identity', async () => {
      await agentApi.getAgentTest(signerOptions);

      await agentApi.getAgentTest(signerOptions);

      expect(CustomHttpAgent.create).toHaveBeenCalledOnce();
    });
  });

  describe('Host and root key', () => {
    it('should call createAgent with fetchRootKey for local development (localhost)', async () => {
      await agentApi.getAgentTest(signerOptions);

      expect(CustomHttpAgent.create).toHaveBeenCalledWith({
        identity,
        shouldFetchRootKey: true,
        host: 'http://localhost:8080'
      });
    });

    it('should call createAgent without fetchRootKey for non-local host', async () => {
      const nonLocalSignerOptions: SignerOptions = {
        owner: identity,
        host: 'https://icp-api.io'
      };

      await agentApi.getAgentTest(nonLocalSignerOptions);

      expect(CustomHttpAgent.create).toHaveBeenCalledWith({
        identity,
        host: 'https://icp-api.io',
        shouldFetchRootKey: false
      });
    });

    it('should default to the mainnet host if host is undefined', async () => {
      const optionsWithoutHost: SignerOptions = {
        owner: identity
      };

      await agentApi.getAgentTest(optionsWithoutHost);

      expect(CustomHttpAgent.create).toHaveBeenCalledWith({
        identity,
        host: 'https://icp-api.io',
        shouldFetchRootKey: false
      });
    });

    it('should call createAgent with fetchRootKey for 127.0.0.1', async () => {
      const localSignerOptions: SignerOptions = {
        owner: identity,
        host: 'http://127.0.0.1:8000'
      };

      await agentApi.getAgentTest(localSignerOptions);

      expect(CustomHttpAgent.create).toHaveBeenCalledWith({
        identity,
        shouldFetchRootKey: true,
        host: 'http://127.0.0.1:8000'
      });
    });
  });
});
