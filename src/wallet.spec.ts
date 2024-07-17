import {beforeEach} from 'vitest';
import {WALLET_WINDOW_CENTER, windowFeatures} from './utils/window.utils';
import {Wallet, type WalletParameters} from './wallet';

describe('Wallet', () => {
  const mockParameters: WalletParameters = {url: 'https://test.com'};

  let originalOpen: typeof window.open;

  beforeEach(() => {
    originalOpen = window.open;

    vi.stubGlobal('open', vi.fn());
    vi.stubGlobal('close', vi.fn());
  });

  afterEach(() => {
    window.open = originalOpen;

    vi.restoreAllMocks();
  });

  it('should connect to the wallet with default options', async () => {
    const addEventListenerSpy = vi.spyOn(window, 'addEventListener');
    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

    const promise = Wallet.connect(mockParameters);

    const messageEvent = new MessageEvent('message', {
      origin: mockParameters.url
    });

    window.dispatchEvent(messageEvent);

    const wallet = await promise;

    expect(wallet).toBeInstanceOf(Wallet);

    expect(window.open).toHaveBeenCalledWith(
      mockParameters.url,
      'walletWindow',
      windowFeatures(WALLET_WINDOW_CENTER)
    );
    expect(window.open).toHaveBeenCalledTimes(1);

    expect(addEventListenerSpy).toHaveBeenCalledWith('message', expect.any(Function));
    expect(removeEventListenerSpy).toHaveBeenCalledWith('message', expect.any(Function));
  });
});
