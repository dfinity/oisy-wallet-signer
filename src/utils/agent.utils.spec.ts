import {shouldFetchRootKey} from './agent.utils';

describe('agent.utils', () => {
  it('should set shouldFetchRootKey to true for localhost', () => {
    const result = shouldFetchRootKey({hostname: 'localhost'});

    expect(result).toEqual({shouldFetchRootKey: true});
  });

  it('should set shouldFetchRootKey to true for subdomain.localhost', () => {
    const result = shouldFetchRootKey({hostname: 'lxzze-o7777-77777-aaaaa-cai.localhost'});

    expect(result).toEqual({shouldFetchRootKey: true});
  });

  it('should not set shouldFetchRootKey to true if domain contains keyword localhost', () => {
    expect(shouldFetchRootKey({hostname: 'mylocalhost.com'})).toEqual({});
    expect(shouldFetchRootKey({hostname: 'localhost.yolo.com'})).toEqual({});
    expect(shouldFetchRootKey({hostname: 'localhost.hello.world.dev'})).toEqual({});
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
