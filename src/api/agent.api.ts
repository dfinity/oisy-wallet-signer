import type {Agent} from '@dfinity/agent';
import {createAgent} from '@dfinity/utils';
import type {SignerOptions} from '../types/signer-options';

export abstract class AgentApi {
  protected async getAgent({host, owner: identity}: SignerOptions): Promise<Agent> {
    const mainnetHost = 'https://icp-api.io';

    const {hostname} = new URL(host ?? mainnetHost);

    const local = ['localhost', '127.0.0.1'].includes(hostname);

    return await createAgent({
      identity,
      ...(local && {fetchRootKey: true}),
      host: host ?? mainnetHost
    });
  }
}
