import {assertNonNullish, nonNullish, notEmptyString} from '@dfinity/utils';
import {nanoid} from 'nanoid';
import {WALLET_CONNECT_DEFAULT_TIMEOUT_IN_MILLISECONDS} from './constants/wallet.constants';
import {retryRequestStatus} from './handlers/wallet.handlers';
import {IcrcReadyResponseSchema} from './types/icrc-responses';
import {RpcResponseWithResultOrErrorSchema} from './types/rpc';
import {WalletOptionsSchema, type WalletOptions} from './types/wallet';
import type {ReadyOrError} from './utils/timeout.utils';
import {WALLET_WINDOW_TOP_RIGHT, windowFeatures} from './utils/window.utils';

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
   * @param {WalletOptions} options - The options to initialize the wallet client.
   * @returns {Promise<Wallet>} A promise that resolves to an instance of the wallet that was connected.
   */
  static async connect(options: WalletOptions): Promise<Wallet> {
    const {success: optionsSuccess, error} = WalletOptionsSchema.safeParse(options);

    if (!optionsSuccess) {
      throw new Error(`Wallet options cannot be parsed: ${error?.message ?? ''}`);
    }

    const {url, windowOptions, connectionOptions} = options;

    const popupFeatures =
      typeof windowOptions === 'string'
        ? windowOptions
        : windowFeatures(windowOptions ?? WALLET_WINDOW_TOP_RIGHT);

    const popup = window.open(url, 'walletWindow', popupFeatures);

    assertNonNullish(popup, 'Unable to open the wallet window.');

    const close = (): void => {
      popup.close();
    };

    class MessageError extends Error {}

    let response: Wallet | MessageError | undefined;

    const onMessage = ({origin, data: msgData}: MessageEvent): void => {
      const {success} = RpcResponseWithResultOrErrorSchema.safeParse(msgData);

      if (!success) {
        // We are only interested in JSON-RPC messages, so we are ignoring any other messages emitted at the window level, as the consumer might be using other events.
        return;
      }

      let expectedOrigin: string;

      try {
        const {origin: walletOrigin} = new URL(url);
        expectedOrigin = walletOrigin;
      } catch (err: unknown) {
        // Unlikely to happen if window.open succeeded
        response = new MessageError(
          `The origin ${origin} of the wallet URL ${url} cannot be parsed.`
        );
        return;
      }

      // In our test suite, origin is set to empty string when the message originate from the same window - i.e. when retryRequestStatus are emitted.// In our test suite, the origin is set to an empty string when the message originates from the same window. This occurs when `retryRequestStatus` events are emitted to `*`.
      if (notEmptyString(origin) && origin !== expectedOrigin) {
        response = new MessageError(
          `The response origin ${origin} does not match the requested wallet URL ${url}.`
        );
        return;
      }

      const {success: isWalletReady} = IcrcReadyResponseSchema.safeParse(msgData);
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

  /**
   * Disconnects the wallet by closing the associated popup window.
   *
   * @returns {Promise<void>} A promise that resolves when the wallet has been successfully disconnected.
   */
  disconnect = async (): Promise<void> => {
    this.#popup.close();
  };
}
