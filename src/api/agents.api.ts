import {HttpAgent} from '@dfinity/agent';
import {createAgent as createAgentUtils, isNullish} from '@dfinity/utils';
import {SignerOptions} from '../types/signer-options';

let agents: Record<string, HttpAgent> | undefined | null = undefined;

export const getAgent = async ({owner, ...rest}: SignerOptions): Promise<HttpAgent> => {
  const key = owner.getPrincipal().toText();

  if (isNullish(agents) || isNullish(agents[key])) {
    const agent = await createAgent({owner, ...rest});

    agents = {
      ...(agents ?? {}),
      [key]: agent
    };

    return agent;
  }

  return agents[key];
};

export const createAgent = async ({owner: identity, host}: SignerOptions): Promise<HttpAgent> => {
  const mainnetHost = 'https://icp-api.io';

  const {hostname} = new URL(host ?? mainnetHost);

  const local = ['localhost', '127.0.0.1'].includes(hostname);

  return await createAgentUtils({
    identity,
    ...(local && {fetchRootKey: true}),
    host: host ?? mainnetHost
  });
};

export const resetAgents = () => (agents = null);
