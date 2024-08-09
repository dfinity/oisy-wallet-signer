import {assertNonNullish, nonNullish, notEmptyString} from '@dfinity/utils';
import {nanoid} from 'nanoid';
import {
  WALLET_CONNECT_DEFAULT_TIMEOUT_IN_MILLISECONDS,
  WALLET_CONNECT_TIMEOUT_REQUEST_SUPPORTED_STANDARD
} from './constants/wallet.constants';
import {requestSupportedStandards, retryRequestStatus} from './handlers/wallet.handlers';
import {
  IcrcReadyResponseSchema,
  IcrcSupportedStandardsResponseSchema,
  type IcrcSupportedStandards
} from './types/icrc-responses';
import {RpcResponseWithResultOrErrorSchema} from './types/rpc';
import {WalletOptionsSchema, type WalletOptions} from './types/wallet-options';
import {WalletRequestOptionsSchema, type WalletRequestOptions} from './types/wallet-request';
import type {ReadyOrError} from './utils/timeout.utils';
import {WALLET_WINDOW_TOP_RIGHT, windowFeatures} from './utils/window.utils';

export class Wallet {
  readonly #origin: string;
  readonly #popup: Window;

  // TODO: we cannot destroy the wallet but the popup might be destroyed / closed manually
  // - should we set origin and popup to null when closed?
  // - should we expose a callback event to inform the consumer?
  //
  // PS: setInterval(() => if popup.closed {reset}, 1000)

  private constructor({origin, popup}: {origin: string; popup: Window}) {
    this.#origin = origin;
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

  /**
   * List the standards supported by the wallet.
   *
   * @async
   * @param {WalletRequestOptions} options - The options for the wallet request, which may include parameters such as timeout settings and other request-specific configurations.
   * @returns {Promise<IcrcSupportedStandards>} A promise that resolves to an object containing the supported ICRC standards by the wallet. This includes details about each standard that the wallet can handle.
   */
  supportedStandards = async (
    options: WalletRequestOptions = {}
  ): Promise<IcrcSupportedStandards> => {
    return await new Promise<IcrcSupportedStandards>((resolve, reject) => {
      const {success: optionsSuccess, error} = WalletRequestOptionsSchema.safeParse(options);

      if (!optionsSuccess) {
        throw new Error(`Wallet request options cannot be parsed: ${error?.message ?? ''}`);
      }

      const {timeoutInMilliseconds: userTimeoutInMilliseconds, requestId: userRequestId} = options;
      const timeoutInMilliseconds =
        userTimeoutInMilliseconds ?? WALLET_CONNECT_TIMEOUT_REQUEST_SUPPORTED_STANDARD;

      const requestId = userRequestId ?? nanoid();

      const timeoutId = setTimeout(() => {
        reject(
          new Error(
            `Supported standards request to wallet timed out after ${timeoutInMilliseconds} milliseconds.`
          )
        );
        disconnect();
      }, timeoutInMilliseconds);

      const onMessage = ({origin, data: msgData}: MessageEvent): void => {
        const {success} = RpcResponseWithResultOrErrorSchema.safeParse(msgData);

        if (!success) {
          // We are only interested in JSON-RPC messages, so we are ignoring any other messages emitted at the window level, as the consumer might be using other events.
          return;
        }

        if (notEmptyString(origin) && origin !== this.#origin) {
          reject(
            new Error(
              `The response origin ${origin} does not match the wallet origin ${this.#origin}.`
            )
          );

          disconnect();
          return;
        }

        const {success: isSupportedStandards, data: supportedStandardsData} =
          IcrcSupportedStandardsResponseSchema.safeParse(msgData);

        if (
          isSupportedStandards &&
          requestId === supportedStandardsData?.id &&
          nonNullish(supportedStandardsData?.result)
        ) {
          const {
            result: {supportedStandards}
          } = supportedStandardsData;
          resolve(supportedStandards);

          disconnect();
        }
      };

      window.addEventListener('message', onMessage);

      const disconnect = (): void => {
        clearTimeout(timeoutId);
        window.removeEventListener('message', onMessage);
      };

      requestSupportedStandards({
        popup: this.#popup,
        origin: this.#origin,
        id: requestId
      });
    });
  };
}
