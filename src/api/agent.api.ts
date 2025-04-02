import {isNullish} from '@dfinity/utils';
import {CustomHttpAgent} from '../agent/custom-http-agent';
import {HttpAgentProvider} from '../agent/http-agent-provider';
import {MAINNET_REPLICA_URL} from '../constants/core.constants';
import type {SignerOptions} from '../types/signer-options';

export abstract class AgentApi {
  #agents: Record<string, HttpAgentProvider | CustomHttpAgent> = {};

  protected async getAgent<T extends HttpAgentProvider | CustomHttpAgent>({
    options,
    type
  }: {
    options: SignerOptions;
    type: 'default' | 'custom';
  }): Promise<T> {
    const {owner} = options;
    const key = `${owner.getPrincipal().toText()}_${type}`;

    if (isNullish(this.#agents[key])) {
      const agent = await this.createAgent({options, type});
      this.#agents[key] = agent;
      return agent as T;
    }
    return this.#agents[key] as T;
  }

  private async createAgent({
    options,
    type
  }: {
    options: SignerOptions;
    type: 'default' | 'custom';
  }): Promise<HttpAgentProvider | CustomHttpAgent> {
    const {owner, host} = options;
    const {hostname} = new URL(host ?? MAINNET_REPLICA_URL);
    const shouldFetchRootKey = ['localhost', '127.0.0.1'].includes(hostname);

    if (type === 'default') {
      return await HttpAgentProvider.create({
        identity: owner,
        host: host ?? MAINNET_REPLICA_URL,
        shouldFetchRootKey
      });
    }
    return await CustomHttpAgent.create({
      identity: owner,
      host: host ?? MAINNET_REPLICA_URL,
      shouldFetchRootKey
    });
  }

  protected async getDefaultAgent(options: SignerOptions): Promise<HttpAgentProvider> {
    return await this.getAgent<HttpAgentProvider>({options, type: 'default'});
  }

  protected async getCustomAgent(options: SignerOptions): Promise<CustomHttpAgent> {
    return await this.getAgent<CustomHttpAgent>({options, type: 'custom'});
  }
}
