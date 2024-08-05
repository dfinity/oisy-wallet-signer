import {assertNonNullish, nonNullish} from '@dfinity/utils';
import {nanoid} from 'nanoid';
import {retryRequestStatus} from './handlers/wallet.handlers';
import {IcrcReadyResponse} from './types/icrc-responses';
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

    const onMessage = ({origin, data: msgData}: MessageEvent): void => {
      // TODO: validate origin

      const {success: isWalletReady} = IcrcReadyResponse.safeParse(msgData);
      if (isWalletReady) {
        wallet = new Wallet({origin});
      }
    };

    window.addEventListener('message', onMessage);

    try {
      const result = await retryRequestStatus({
        popup,
        isReady: (): boolean => nonNullish(wallet),
        id: nanoid()
      });

      if (result === 'timeout') {
        throw new Error('Connection timeout. Unable to connect to the wallet.');
      }

      assertNonNullish(
        wallet,
        'Unexpected error. Request status succeeded, but wallet is not defined.'
      );

      return wallet;
    } finally {
      const disconnect = (): void => {
        window.removeEventListener('message', onMessage);
        popup.close();
      };

      disconnect();
    }
  }
}
