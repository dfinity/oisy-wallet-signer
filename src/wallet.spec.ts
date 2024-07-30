import {beforeEach} from 'vitest';
import * as walletHandlers from './handlers/wallet.handlers';
import {WALLET_WINDOW_CENTER, WALLET_WINDOW_TOP_RIGHT, windowFeatures} from './utils/window.utils';
import {Wallet, type WalletParameters} from './wallet';

describe('Wallet', () => {
  const mockParameters: WalletParameters = {url: 'https://test.com'};

  let originalOpen: typeof window.open;

  describe('Window success', () => {
    beforeEach(() => {
      originalOpen = window.open;

      vi.stubGlobal(
        'open',
        vi.fn(() => window)
      );
      vi.stubGlobal('close', vi.fn());
    });

    afterEach(() => {
      window.open = originalOpen;

      vi.restoreAllMocks();
    });

    const options = [
      {
        title: 'default options',
        params: mockParameters,
        expectedOptions: windowFeatures(WALLET_WINDOW_TOP_RIGHT)
      },
      {
        title: 'centered window',
        params: {
          ...mockParameters,
          windowOptions: WALLET_WINDOW_CENTER
        },
        expectedOptions: windowFeatures(WALLET_WINDOW_CENTER)
      },
      {
        title: 'custom window',
        params: {
          ...mockParameters,
          windowOptions: 'height=600, width=400'
        },
        expectedOptions: 'height=600, width=400'
      }
    ];

    it.each(options)('$title', async ({params, expectedOptions}) => {
      const addEventListenerSpy = vi.spyOn(window, 'addEventListener');
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

      const promise = Wallet.connect(params);

      const messageEvent = new MessageEvent('message', {
        origin: mockParameters.url
      });

      window.dispatchEvent(messageEvent);

      const wallet = await promise;

      expect(wallet).toBeInstanceOf(Wallet);

      expect(window.open).toHaveBeenCalledWith(mockParameters.url, 'walletWindow', expectedOptions);
      expect(window.open).toHaveBeenCalledTimes(1);

      expect(addEventListenerSpy).toHaveBeenCalledWith('message', expect.any(Function));
      expect(removeEventListenerSpy).toHaveBeenCalledWith('message', expect.any(Function));
    });

    it('should throw connection timeout error', async () => {
      vi.spyOn(walletHandlers, 'retryRequestStatus').mockResolvedValue('timeout');

      await expect(Wallet.connect(mockParameters)).rejects.toThrow(
        'Connection timeout. Unable to connect to the wallet.'
      );
    });

    it('should assert edge case wallet not defined but request status success', async () => {
      vi.spyOn(walletHandlers, 'retryRequestStatus').mockResolvedValue('ready');

      await expect(Wallet.connect(mockParameters)).rejects.toThrow(
        'Unexpected error. Request status succeeded, but wallet is not defined.'
      );
    });
  });

  describe('Window failure', () => {
    beforeEach(() => {
      originalOpen = window.open;

      vi.stubGlobal(
        'open',
        vi.fn(() => undefined)
      );
      vi.stubGlobal('close', vi.fn());
    });

    afterEach(() => {
      window.open = originalOpen;

      vi.restoreAllMocks();
    });

    it('should throw cannot open window', async () => {
      await expect(Wallet.connect(mockParameters)).rejects.toThrow(
        'Unable to open the wallet window.'
      );
    });
  });
});
