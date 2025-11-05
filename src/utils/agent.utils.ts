import type {HttpAgentOptions} from '@icp-sdk/core/agent';

export const shouldFetchRootKey = ({
  hostname
}: {
  hostname: string;
}): Pick<HttpAgentOptions, 'shouldFetchRootKey' | 'host'> => {
  const localhost =
    ['localhost', '127.0.0.1'].includes(hostname) || hostname.endsWith('.localhost');

  return {
    ...(localhost && {shouldFetchRootKey: true})
  };
};
