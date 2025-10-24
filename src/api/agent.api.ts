import {isNullish} from '@dfinity/utils';
import {CustomHttpAgent} from '../agent/custom-http-agent';
import {HttpAgentProvider} from '../agent/http-agent-provider';
import {MAINNET_REPLICA_URL} from '../constants/core.constants';
import type {SignerOptions} from '../types/signer-options';
import {shouldFetchRootKey} from '../utils/agent.utils';

export abstract class AgentApi {
  #agents: Record<string, HttpAgentProvider> | undefined = undefined;

  private async getAgent({
    options,
    type
  }: {
    options: SignerOptions;
    type: 'default' | 'custom';
  }): Promise<HttpAgentProvider | CustomHttpAgent> {
    const {owner} = options;
    const key = `${owner.getPrincipal().toText()}_${type}`;

    if (isNullish(this.#agents) || isNullish(this.#agents[key])) {
      const agent = await this.createAgent({options, type});

      this.#agents = {
        ...(this.#agents ?? {}),
        [key]: agent
      };

      return agent;
    }

    return this.#agents[key];
  }

  private async createAgent({
    options: {owner: identity, host},
    type
  }: {
    options: SignerOptions;
    type: 'default' | 'custom';
  }): Promise<HttpAgentProvider | CustomHttpAgent> {
    const {hostname} = new URL(host ?? MAINNET_REPLICA_URL);

    const createOptions = {
      identity,
      host: host ?? MAINNET_REPLICA_URL,
      ...shouldFetchRootKey({hostname})
    };

    if (type === 'default') {
      return await HttpAgentProvider.create(createOptions);
    }
    return await CustomHttpAgent.create(createOptions);
  }

  /**
   *Returns a default `HttpAgentProvider` instance for the given signer options.
   *This agent does not overwrite any default features provided by agent-js.
   *
   * @param {SignerOptions} options - The signer configuration including identity and host.
   * @returns {Promise<HttpAgentProvider>} - A promise that resolves to a default agent instance.
   */
  protected async getDefaultAgent(options: SignerOptions): Promise<HttpAgentProvider> {
    return (await this.getAgent({options, type: 'default'})) as HttpAgentProvider;
  }

  /**
   * Returns a `CustomHttpAgent` instance for the given signer options.
   * This agent uses custom transforms that are notably used to handle nonce in calls.
   *
   * @param {SignerOptions} options - The signer configuration including identity and host.
   * @returns {Promise<CustomHttpAgent>} - A promise that resolves to a custom agent instance.
   */
  protected async getCustomAgent(options: SignerOptions): Promise<CustomHttpAgent> {
    return (await this.getAgent({options, type: 'custom'})) as CustomHttpAgent;
  }
}
