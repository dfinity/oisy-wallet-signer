import {assertNonNullish, nonNullish, notEmptyString} from '@dfinity/utils';
import {nanoid} from 'nanoid';
import {retryRequestStatus} from './handlers/wallet.handlers';
import {IcrcReadyResponse} from './types/icrc-responses';
import type {ReadyOrError} from './utils/timeout.utils';
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

    class MessageError extends Error {}

    let response: Wallet | MessageError | undefined;

    const onMessage = ({origin, data: msgData}: MessageEvent): void => {
      // In our test suite, origin is set to empty string when the message originate from the same window - i.e. when retryRequestStatus are emitted.// In our test suite, the origin is set to an empty string when the message originates from the same window. This occurs when `retryRequestStatus` events are emitted to `*`.
      if (notEmptyString(origin) && origin !== url) {
        response = new MessageError(
          `The response origin ${origin} does not match the requested wallet URL ${url}.`
        );
        return;
      }

      const {success: isWalletReady} = IcrcReadyResponse.safeParse(msgData);
      if (isWalletReady) {
        response = new Wallet({origin});
      }
    };

    window.addEventListener('message', onMessage);

    try {
      const result = await retryRequestStatus({
        popup,
        isReady: (): ReadyOrError | 'pending' =>
          nonNullish(response) ? (response instanceof Wallet ? 'ready' : 'error') : 'pending',
        id: nanoid()
      });

      if (result === 'timeout') {
        throw new Error('Connection timeout. Unable to connect to the wallet.');
      }

      assertNonNullish(
        response,
        'Unexpected error. The request status succeeded, but the wallet response is not defined.'
      );

      if (response instanceof MessageError) {
        throw response;
      }

      return response;
    } finally {
      const disconnect = (): void => {
        window.removeEventListener('message', onMessage);
        popup.close();
      };

      disconnect();
    }
  }
}
