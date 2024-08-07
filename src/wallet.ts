import {assertNonNullish, nonNullish, notEmptyString} from '@dfinity/utils';
import {nanoid} from 'nanoid';
import {WALLET_CONNECT_DEFAULT_TIMEOUT_IN_MILLISECONDS} from './constants/wallet.constants';
import {retryRequestStatus} from './handlers/wallet.handlers';
import {IcrcReadyResponse} from './types/icrc-responses';
import {RpcResponseWithResultOrError} from './types/rpc';
import type {ReadyOrError} from './utils/timeout.utils';
import {
  WALLET_WINDOW_TOP_RIGHT,
  windowFeatures,
  type WalletWindowOptions
} from './utils/window.utils';

export interface WalletConnectionOptions {
  /**
   * Specifies the interval in milliseconds at which the wallet is checked (polled) to determine if it is ready.
   *
   * @default 500 - The default polling interval is set to 500 milliseconds.
   */
  pollingIntervalInMilliseconds?: number;

  /**
   * Specifies the maximum duration in milliseconds for attempting to establish a connection to the wallet.
   * If the connection is not established within this duration, the process will time out.
   *
   * @default 120 - The default timeout is set to 120 seconds.
   */
  timeoutInMilliseconds?: number;
}

/**
 * The options to establish a connection with a wallet.
 * @interface
 */
export interface WalletOptions {
  /**
   * The URL of the wallet.
   */
  url: string;

  /**
   * Optional window options to display the wallet, which can be an object of type WalletWindowOptions or a string.
   * If a string is passed, those are applied as-is to the window that is opened (see https://developer.mozilla.org/en-US/docs/Web/API/Window/open#windowfeatures for more information).
   */
  windowOptions?: WalletWindowOptions | string;

  /**
   * The connection options for establishing the connection with the wallet.
   */
  connectionOptions?: WalletConnectionOptions;
}

export class Wallet {
  readonly #walletOrigin: string | undefined;
  readonly #popup: Window;

  private constructor({origin, popup}: {origin: string; popup: Window}) {
    this.#walletOrigin = origin;
    this.#popup = popup;
  }

  /**
   * Establish a connection with a wallet.
   *
   * @static
   * @param {Object} WalletOptions - The options to initialize the wallet client.
   * @returns {Promise<Wallet>} A promise that resolves to an instance of the wallet that was connected.
   */
  static async connect({
    url,
    windowOptions = WALLET_WINDOW_TOP_RIGHT,
    connectionOptions
  }: WalletOptions): Promise<Wallet> {
    const popupFeatures =
      typeof windowOptions === 'string' ? windowOptions : windowFeatures(windowOptions);

    const popup = window.open(url, 'walletWindow', popupFeatures);

    assertNonNullish(popup, 'Unable to open the wallet window.');

    const close = (): void => {
      popup.close();
    };

    class MessageError extends Error {}

    let response: Wallet | MessageError | undefined;

    const onMessage = ({origin, data: msgData}: MessageEvent): void => {
      const {success} = RpcResponseWithResultOrError.safeParse(msgData);

      if (!success) {
        // We are only interested in JSON-RPC messages, so we are ignoring any other messages emitted at the window level, as the consumer might be using other events.
        return;
      }

      // In our test suite, origin is set to empty string when the message originate from the same window - i.e. when retryRequestStatus are emitted.// In our test suite, the origin is set to an empty string when the message originates from the same window. This occurs when `retryRequestStatus` events are emitted to `*`.
      if (notEmptyString(origin) && origin !== url) {
        response = new MessageError(
          `The response origin ${origin} does not match the requested wallet URL ${url}.`
        );
        return;
      }

      const {success: isWalletReady} = IcrcReadyResponse.safeParse(msgData);
      if (isWalletReady) {
        response = new Wallet({origin, popup});
      }
    };

    window.addEventListener('message', onMessage);

    const disconnect = (): void => {
      window.removeEventListener('message', onMessage);
    };

    const connect = async (): Promise<Wallet> => {
      const result = await retryRequestStatus({
        popup,
        isReady: (): ReadyOrError | 'pending' =>
          nonNullish(response) ? (response instanceof Wallet ? 'ready' : 'error') : 'pending',
        id: nanoid(),
        timeoutInMilliseconds:
          connectionOptions?.timeoutInMilliseconds ??
          WALLET_CONNECT_DEFAULT_TIMEOUT_IN_MILLISECONDS,
        intervalInMilliseconds: connectionOptions?.pollingIntervalInMilliseconds
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
    };

    try {
      return await connect();
    } catch (err: unknown) {
      // We close the popup only in case of an error. If the connection is successful, the developers will interact with the wallet and are responsible for disconnecting it.
      close();

      throw err;
    } finally {
      // We remove the event listener because this implementation scopes message exchanges to individual functions. Each function subscribes to messages, notifies the wallet, and waits for a response.
      disconnect();
    }
  }

  async disconnect(): Promise<void> {
    this.#popup.close();
  }
}
