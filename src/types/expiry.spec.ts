import {Expiry} from '@icp-sdk/core/agent';

import {ExpiryObjSchema} from './expiry';

describe('ExpiryObjSchema', () => {
  it('parses a valid Expiry object and returns an Expiry instance', () => {
    const value = 11122233n;

    const input = {
      _isExpiry: true,
      __expiry__: value
    };

    const result = ExpiryObjSchema.safeParse(input);

    expect(result.success).toBeTruthy();
    expect(result.data instanceof Expiry).toBeTruthy();
    expect(result.data?.toBigInt()).toBe(value);
  });

  it('fails if _isExpiry is missing', () => {
    const result = ExpiryObjSchema.safeParse({
      __expiry__: 1256789n
    });

    expect(result.success).toBeFalsy();
    expect(result?.error?.issues[0].path).toEqual(['_isExpiry']);
  });

  it('fails if __expiry__ is not a bigint', () => {
    const result = ExpiryObjSchema.safeParse({
      _isExpiry: true,
      __expiry__: '126789'
    });

    expect(result.success).toBeFalsy();
    expect(result?.error?.issues[0].path).toEqual(['__expiry__']);
  });

  it('fails if extra properties are included', () => {
    const result = ExpiryObjSchema.safeParse({
      _isExpiry: true,
      __expiry__: 1234999789n,
      extra: 'nope'
    });

    expect(result.success).toBeFalsy();
    expect(result?.error?.issues[0].code).toBe('unrecognized_keys');
    expect(result?.error?.issues[0].path).toEqual([]);
  });
});
