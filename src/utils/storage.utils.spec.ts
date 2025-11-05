import {Ed25519KeyIdentity} from '@icp-sdk/core/identity';
import {del, get, set} from './storage.utils';

describe('storage.utils', () => {
  const newIdentity = Ed25519KeyIdentity.generate();
  const key = 'testKey';
  const value = {userId: newIdentity.getPrincipal().toText()};

  beforeEach(() => {
    localStorage.clear();
  });

  it('should set an item in localStorage', () => {
    set({key, value});

    expect(localStorage.getItem(key)).toEqual(JSON.stringify(value));
  });

  it('should get an item from localStorage', () => {
    localStorage.setItem(key, JSON.stringify(value));

    const result = get({key});

    expect(result).toEqual(value);
  });

  it('should return undefined if key does not exist', () => {
    const key = 'unknownKey';

    const result = get({key});

    expect(result).toBeUndefined();
  });

  it('should delete an item from localStorage', () => {
    set({key, value});

    const result = get({key});

    expect(result).not.toBeUndefined();

    del({key});

    expect(localStorage.getItem(key)).toBeNull();

    const resultAfterDelete = get({key});

    expect(resultAfterDelete).toBeUndefined();
  });

  it('should ignore error on get if key is not a JSON object', () => {
    localStorage.setItem(key, 'something like a string');

    const spy = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    const result = get({key});

    expect(result).toBeUndefined();

    spy.mockClear();
  });
});
