import {Ed25519KeyIdentity} from '@icp-sdk/core/identity';
import {CustomHttpAgent} from '../agent/custom-http-agent';
import {HttpAgentProvider} from '../agent/http-agent-provider';
import type {SignerOptions} from '../types/signer-options';
import {AgentApi} from './agent.api';

vi.mock('../agent/custom-http-agent', () => ({
  CustomHttpAgent: {
    create: vi.fn().mockResolvedValue({test: 'mockCustomAgent'})
  }
}));

vi.mock('../agent/http-agent-provider', () => ({
  HttpAgentProvider: {
    create: vi.fn().mockResolvedValue({test: 'mockDefaultAgent'})
  }
}));

class TestAgent extends AgentApi {
  async getAgentTest({
    options,
    type
  }: {
    options: SignerOptions;
    type: 'default' | 'custom';
  }): Promise<CustomHttpAgent | HttpAgentProvider> {
    return type === 'default'
      ? await this.getDefaultAgent(options)
      : await this.getCustomAgent(options);
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

  describe('Cache for Custom AgentApi', () => {
    const identity2 = Ed25519KeyIdentity.generate();

    it('should call createAgent and cache the result for the first call', async () => {
      const agent = await agentApi.getAgentTest({options: signerOptions, type: 'custom'});

      expect(CustomHttpAgent.create).toHaveBeenCalledExactlyOnceWith({
        identity,
        shouldFetchRootKey: true,
        host: 'http://localhost:8080'
      });

      expect(agent).toEqual({test: 'mockCustomAgent'});

      await agentApi.getAgentTest({options: signerOptions, type: 'custom'});
    });

    it('should create and cache a new agent for a different identity', async () => {
      await agentApi.getAgentTest({options: signerOptions, type: 'custom'});

      const differentSignerOptions: SignerOptions = {
        owner: identity2,
        host: 'http://localhost:8080'
      };

      const newAgent = await agentApi.getAgentTest({
        options: differentSignerOptions,
        type: 'custom'
      });

      expect(CustomHttpAgent.create).toHaveBeenCalledTimes(2);
      expect(newAgent).toEqual({test: 'mockCustomAgent'});
    });

    it('should not call createAgent if the agent is already cached for the same identity and type', async () => {
      await agentApi.getAgentTest({options: signerOptions, type: 'custom'});

      await agentApi.getAgentTest({options: signerOptions, type: 'custom'});

      expect(CustomHttpAgent.create).toHaveBeenCalledOnce();
    });
  });

  describe('Cache for default AgentApi', () => {
    const identity2 = Ed25519KeyIdentity.generate();

    it('should call createAgent and cache the result for the first call(custom)', async () => {
      const agent = await agentApi.getAgentTest({options: signerOptions, type: 'default'});

      expect(HttpAgentProvider.create).toHaveBeenCalledExactlyOnceWith({
        identity,
        shouldFetchRootKey: true,
        host: 'http://localhost:8080'
      });

      expect(agent).toEqual({test: 'mockDefaultAgent'});

      await agentApi.getAgentTest({options: signerOptions, type: 'default'});
    });

    it('should call createAgent and cache the result for the first call(default)', async () => {
      const agent = await agentApi.getAgentTest({options: signerOptions, type: 'default'});

      expect(HttpAgentProvider.create).toHaveBeenCalledExactlyOnceWith({
        identity,
        shouldFetchRootKey: true,
        host: 'http://localhost:8080'
      });

      expect(agent).toEqual({test: 'mockDefaultAgent'});

      await agentApi.getAgentTest({options: signerOptions, type: 'default'});
    });

    it('should create and cache a new agent for a different identity', async () => {
      await agentApi.getAgentTest({options: signerOptions, type: 'default'});

      const differentSignerOptions: SignerOptions = {
        owner: identity2,
        host: 'http://localhost:8080'
      };

      const newAgent = await agentApi.getAgentTest({
        options: differentSignerOptions,
        type: 'default'
      });

      expect(HttpAgentProvider.create).toHaveBeenCalledTimes(2);
      expect(newAgent).toEqual({test: 'mockDefaultAgent'});
    });

    it('should not call createAgent if the agent is already cached for the same identity and type', async () => {
      await agentApi.getAgentTest({options: signerOptions, type: 'default'});

      await agentApi.getAgentTest({options: signerOptions, type: 'default'});

      expect(HttpAgentProvider.create).toHaveBeenCalledOnce();
    });
  });

  describe('Host and root key Custom AgentApi', () => {
    it('should call createAgent with fetchRootKey for local development (localhost)', async () => {
      await agentApi.getAgentTest({options: signerOptions, type: 'custom'});

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

      await agentApi.getAgentTest({options: nonLocalSignerOptions, type: 'custom'});

      expect(CustomHttpAgent.create).toHaveBeenCalledWith({
        identity,
        host: 'https://icp-api.io'
      });
    });

    it('should default to the mainnet host if host is undefined', async () => {
      const optionsWithoutHost: SignerOptions = {
        owner: identity
      };

      await agentApi.getAgentTest({options: optionsWithoutHost, type: 'custom'});

      expect(CustomHttpAgent.create).toHaveBeenCalledWith({
        identity,
        host: 'https://icp-api.io'
      });
    });

    it('should call createAgent with fetchRootKey for 127.0.0.1', async () => {
      const localSignerOptions: SignerOptions = {
        owner: identity,
        host: 'http://127.0.0.1:8000'
      };

      await agentApi.getAgentTest({options: localSignerOptions, type: 'custom'});

      expect(CustomHttpAgent.create).toHaveBeenCalledWith({
        identity,
        shouldFetchRootKey: true,
        host: 'http://127.0.0.1:8000'
      });
    });
  });

  describe('Host and root key default AgentApi', () => {
    it('should call createAgent with fetchRootKey for local development (localhost)', async () => {
      await agentApi.getAgentTest({options: signerOptions, type: 'default'});

      expect(HttpAgentProvider.create).toHaveBeenCalledWith({
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

      await agentApi.getAgentTest({options: nonLocalSignerOptions, type: 'default'});

      expect(HttpAgentProvider.create).toHaveBeenCalledWith({
        identity,
        host: 'https://icp-api.io'
      });
    });

    it('should default to the mainnet host if host is undefined', async () => {
      const optionsWithoutHost: SignerOptions = {
        owner: identity
      };

      await agentApi.getAgentTest({options: optionsWithoutHost, type: 'default'});

      expect(HttpAgentProvider.create).toHaveBeenCalledWith({
        identity,
        host: 'https://icp-api.io'
      });
    });

    it('should call createAgent with fetchRootKey for 127.0.0.1', async () => {
      const localSignerOptions: SignerOptions = {
        owner: identity,
        host: 'http://127.0.0.1:8000'
      };

      await agentApi.getAgentTest({options: localSignerOptions, type: 'default'});

      expect(HttpAgentProvider.create).toHaveBeenCalledWith({
        identity,
        shouldFetchRootKey: true,
        host: 'http://127.0.0.1:8000'
      });
    });
  });
});
