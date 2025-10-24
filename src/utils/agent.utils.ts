import type {HttpAgentOptions} from '@dfinity/agent';

export const shouldFetchRootKey = ({
  hostname
}: {
  hostname: string;
}): Pick<HttpAgentOptions, 'shouldFetchRootKey' | 'host'> => {
  const localhost = ['localhost', '127.0.0.1'].includes(hostname);

  return {
    ...(localhost && {shouldFetchRootKey: true})
  };
};
