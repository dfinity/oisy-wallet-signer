import {isBrowser} from './env.utils';

describe('isBrowser', () => {
  it('should return true if the current environment is a browser', () => {
    expect(isBrowser()).toBeTruthy();
  });

  it('should return false if the current environment is node', () => {
    vi.stubGlobal('window', undefined);

    expect(isBrowser()).toBeFalsy();

    vi.unstubAllGlobals();
  });
});
