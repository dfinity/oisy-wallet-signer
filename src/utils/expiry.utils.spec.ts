import {Expiry, JSON_KEY_EXPIRY} from '@dfinity/agent';

import {bigIntToExpiry} from './expiry.utils';

describe('bigIntToExpiry', () => {
  it('should convert bigint to Expiry using fromJSON', () => {
    const mockFromJSON = vi.spyOn(Expiry, 'fromJSON');

    const value = 123789n;
    const expectedJson = JSON.stringify({[JSON_KEY_EXPIRY]: value.toString()});

    bigIntToExpiry(value);

    expect(mockFromJSON).toHaveBeenCalledWith(expectedJson);
  });

  it('should return an instance of Expiry', () => {
    const value = 9874321n;
    const result = bigIntToExpiry(value);

    expect(result).toBeInstanceOf(Expiry);
  });

  it('should return a value Expiry object', () => {
    const value = 555554321n;
    const result = bigIntToExpiry(value);

    expect(result instanceof Expiry).toBeTruthy();
    expect(result.toBigInt()).toBe(value);
  });
});
