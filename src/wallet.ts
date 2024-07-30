import {assertNonNullish, nonNullish} from '@dfinity/utils';
import {nanoid} from 'nanoid';
import {ICRC29_STATUS} from './types/icrc';
import type {IcrcWalletStatusRequestType} from './types/icrc-requests';
import {JSON_RPC_VERSION_2} from './types/rpc';
import {retryUntilReady} from './utils/timeout.utils';
import {
  WALLET_WINDOW_TOP_RIGHT,
  windowFeatures,
  type WalletWindowOptions
} from './utils/window.utils';

/**
 * The parameters to establish a connection with a wallet.
 * @interface
 */
export interface WalletParameters {
  /**
   * The URL of the wallet.
   */
  url: string;

  /**
   * Optional window options to display the wallet, which can be an object of type WalletWindowOptions or a string.
   * If a string is passed, those are applied as-is to the window that is opened (see https://developer.mozilla.org/en-US/docs/Web/API/Window/open#windowfeatures for more information).
   */
  windowOptions?: WalletWindowOptions | string;
}

export class Wallet {
  readonly #walletOrigin: string | undefined;

  private constructor({origin}: {origin: string | undefined}) {
    this.#walletOrigin = origin;
  }

  /**
   * Establish a connection with a wallet.
   *
   * @static
   * @param {Object} WalletParameters - The parameters to initialize the wallet connection.
   * @returns {Promise<Wallet>} A promise that resolves to an instance of the wallet that was connected.
   */
  static async connect({
    url,
    windowOptions = WALLET_WINDOW_TOP_RIGHT
  }: WalletParameters): Promise<Wallet> {
    const popupFeatures =
      typeof windowOptions === 'string' ? windowOptions : windowFeatures(windowOptions);

    const popup = window.open(url, 'walletWindow', popupFeatures);

    assertNonNullish(popup, 'Unable to open the wallet window.');

    let wallet: Wallet | undefined;

    const onMessage = ({origin, data}: MessageEvent): void => {
      // TODO: safeParse + validate ID
      wallet = new Wallet({origin});
    };

    window.addEventListener('message', onMessage);

    const requestStatus = (): void => {
      const msg: IcrcWalletStatusRequestType = {
        id: nanoid(),
        jsonrpc: JSON_RPC_VERSION_2,
        method: ICRC29_STATUS
      };

      popup.postMessage(msg, '*');
    };

    const result = await retryUntilReady({
      retries: 60,
      isReady: (): boolean => nonNullish(wallet),
      fn: requestStatus
    });

    const disconnect = (): void => {
      window.removeEventListener('message', onMessage);
      popup.close();
    };

    disconnect();

    if (result === 'timeout') {
      throw new Error('Unable to connect wallet. Timeout.');
    }

    assertNonNullish(wallet);

    return wallet;
  }
}
