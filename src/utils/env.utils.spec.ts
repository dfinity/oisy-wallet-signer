import {describe, expect, it, vi} from 'vitest';
import {isBrowser} from './env.utils';

describe('isBrowser', () => {
  it('should return true if the current environment is a browser', () => {
    expect(isBrowser()).toBe(true);
  });

  it('should return false if the current environment is node', () => {
    vi.stubGlobal('window', undefined);

    expect(isBrowser()).toBe(false);

    vi.unstubAllGlobals();
  });
});
