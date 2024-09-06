import type {Agent, HttpAgent} from '@dfinity/agent';
import {createAgent as createAgentUtils, isNullish} from '@dfinity/utils';
import type {SignerOptions} from '../types/signer-options';

export abstract class AgentApi {
  #agents: Record<string, HttpAgent> | undefined = undefined;

  protected async getAgent({owner, ...rest}: SignerOptions): Promise<Agent> {
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

  private async createAgent({owner: identity, host}: SignerOptions): Promise<HttpAgent> {
    const mainnetHost = 'https://icp-api.io';

    const {hostname} = new URL(host ?? mainnetHost);

    const local = ['localhost', '127.0.0.1'].includes(hostname);

    return await createAgentUtils({
      identity,
      ...(local && {fetchRootKey: true}),
      host: host ?? mainnetHost
    });
  }
}
