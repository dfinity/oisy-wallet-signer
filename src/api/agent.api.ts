import {isNullish} from '@dfinity/utils';
import {MAINNET_REPLICA_URL} from '../../demo/src/core/constants/app.constants';
import {CustomHttpAgent} from '../agent/custom-http-agent';
import type {SignerOptions} from '../types/signer-options';

export abstract class AgentApi {
  #agents: Record<string, CustomHttpAgent> | undefined = undefined;

  protected async getAgent({owner, ...rest}: SignerOptions): Promise<CustomHttpAgent> {
    const key = owner.getPrincipal().toText();

    if (isNullish(this.#agents) || isNullish(this.#agents[key])) {
      const agent = await this.createAgent({owner, ...rest});

      this.#agents = {
        ...(this.#agents ?? {}),
        [key]: agent
      };

      return agent;
    }

    return this.#agents[key];
  }

  private async createAgent({owner: identity, host}: SignerOptions): Promise<CustomHttpAgent> {
    const {hostname} = new URL(host ?? MAINNET_REPLICA_URL);

    const shouldFetchRootKey = ['localhost', '127.0.0.1'].includes(hostname);

    return await CustomHttpAgent.create({
      identity,
      host: host ?? MAINNET_REPLICA_URL,
      shouldFetchRootKey
    });
  }
}
