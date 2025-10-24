import {shouldFetchRootKey} from './agent.utils';

describe('agent.utils', () => {
  it('should set shouldFetchRootKey to true for localhost', () => {
    const result = shouldFetchRootKey({hostname: 'localhost'});

    expect(result).toEqual({shouldFetchRootKey: true});
  });

  it('should set shouldFetchRootKey to true for 127.0.0.1', () => {
    const result = shouldFetchRootKey({hostname: '127.0.0.1'});

    expect(result).toEqual({shouldFetchRootKey: true});
  });

  it('should not set shouldFetchRootKey for non-localhost hostnames', () => {
    expect(shouldFetchRootKey({hostname: 'icp0.io'})).toEqual({});
    expect(shouldFetchRootKey({hostname: 'hello.com'})).toEqual({});
    expect(shouldFetchRootKey({hostname: 'yellow.submarine.com'})).toEqual({});
  });

  it('should not set shouldFetchRootKey for empty hostname', () => {
    const result = shouldFetchRootKey({hostname: ''});

    expect(result).toEqual({});
  });
});
