import {isNullish} from '@dfinity/utils';
import {HttpAgentProvider} from '../agent/vanilla-agent';
import {MAINNET_REPLICA_URL} from '../constants/core.constants';
import type {SignerOptions} from '../types/signer-options';
import { CustomHttpAgent } from '../agent/transform.agent';

export abstract class AgentApi {
  #agents: Record<string, HttpAgentProvider | CustomHttpAgent> = {};
  protected async getAgent({
    options,
    type
  }: {
    options: SignerOptions;
    type: 'basic' | 'custom';
  }): Promise<HttpAgentProvider | CustomHttpAgent> {
    const {owner} = options;
    const key = `${owner.getPrincipal().toText()}_${type}`;

    if (isNullish(this.#agents[key])) {
      this.#agents[key] = await this.createAgentInstance({options, type});
    }
    return this.#agents[key];
  }

  private async createAgentInstance({
    options,
    type
  }: {
    options: SignerOptions;
    type: 'basic' | 'custom';
  }): Promise<HttpAgentProvider | CustomHttpAgent> {
    const {owner, host} = options;
    const {hostname} = new URL(host ?? MAINNET_REPLICA_URL);
    const shouldFetchRootKey = ['localhost', '127.0.0.1'].includes(hostname);

    if (type === 'basic') {
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

  protected async getBasicAgent(options: SignerOptions): Promise<HttpAgentProvider> {
    return (await this.getAgent({options, type: 'basic'})) as HttpAgentProvider;
  }

  protected async getCustomAgent(options: SignerOptions): Promise<CustomAgent> {
    return (await this.getAgent({options, type: 'custom'})) as CustomAgent;
  }
}
