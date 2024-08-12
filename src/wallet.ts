import {assertNonNullish, nonNullish, notEmptyString} from '@dfinity/utils';
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
import {RpcResponseWithResultOrErrorSchema, type RpcId} from './types/rpc';
import type {WalletMessageEvent, WalletMessageEventData} from './types/wallet';
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
        id: crypto.randomUUID(),
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
   * Sends an asynchronous request to the wallet and handles the response with the provided handlers.
   *
   * @template T - The type of the result expected from the response.
   *
   * @param {Object} params - Parameters for the request.
   * @param {WalletRequestOptions} params.options - Options for configuring the wallet request.
   * @param {(id: RpcId) => void} params.postRequest - The request function that sends the request to the wallet using either the provided ID or a generated ID.
   * @param {(params: { data: WalletMessageEventData; id: RpcId }) => Promise<{ handled: boolean; result?: T }>} params.handleMessage -
   *        A function to handle incoming messages, which should return an object indicating whether the message was handled and optionally include the result. If both `handled` is `true` and the `result` is not `null`, the process is disconnected, i.e., no more listeners will await an answer from the wallet.
   *
   * @returns {Promise<T>} A promise that resolves with the result of the request.
   *
   * @throws {Error} If the wallet request options cannot be parsed or if the request times out.
   *
   * @private
   */
  private readonly request = async <T>({
    options,
    postRequest,
    handleMessage
  }: {
    options: WalletRequestOptions;
    postRequest: (id: RpcId) => void;
    handleMessage: (params: {
      data: WalletMessageEventData;
      id: RpcId;
    }) => Promise<{handled: boolean; result?: T}>;
  }): Promise<T> => {
    return await new Promise<T>((resolve, reject) => {
      const {success: optionsSuccess, error} = WalletRequestOptionsSchema.safeParse(options);

      if (!optionsSuccess) {
        throw new Error(`Wallet request options cannot be parsed: ${error?.message ?? ''}`);
      }

      const {timeoutInMilliseconds: userTimeoutInMilliseconds, requestId: userRequestId} = options;
      const timeoutInMilliseconds =
        userTimeoutInMilliseconds ?? WALLET_CONNECT_TIMEOUT_REQUEST_SUPPORTED_STANDARD;

      const requestId = userRequestId ?? crypto.randomUUID();

      const timeoutId = setTimeout(() => {
        reject(
          new Error(`Request to wallet timed out after ${timeoutInMilliseconds} milliseconds.`)
        );
        disconnect();
      }, timeoutInMilliseconds);

      const onMessage = async ({origin, data}: WalletMessageEvent): Promise<void> => {
        const {success} = RpcResponseWithResultOrErrorSchema.safeParse(data);

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

        const {handled, result} = await handleMessage({data, id: requestId});

        if (handled && nonNullish(result)) {
          resolve(result);
          disconnect();
        }
      };

      const onMessageListener = (message: WalletMessageEvent): void => {
        void onMessage(message);
      };

      window.addEventListener('message', onMessageListener);

      const disconnect = (): void => {
        clearTimeout(timeoutId);
        window.removeEventListener('message', onMessageListener);
      };

      postRequest(requestId);
    });
  };

  /**
   * List the standards supported by the wallet.
   *
   * @async
   * @param {WalletRequestOptions} options - The options for the wallet request, which may include parameters such as timeout settings and other request-specific configurations.
   * @returns {Promise<IcrcSupportedStandards>} A promise that resolves to an object containing the supported ICRC standards by the wallet. This includes details about each standard that the wallet can handle.
   * @see [ICRC25 Supported Standards](https://github.com/dfinity/wg-identity-authentication/blob/main/topics/icrc_25_signer_interaction_standard.md#icrc25_supported_standards)
   */
  supportedStandards = async ({
    options = {}
  }: {options?: WalletRequestOptions} = {}): Promise<IcrcSupportedStandards> => {
    const handleMessage = async ({
      data,
      id
    }: {
      data: WalletMessageEventData;
      id: RpcId;
    }): Promise<{handled: boolean; result?: IcrcSupportedStandards}> => {
      const {success: isSupportedStandards, data: supportedStandardsData} =
        IcrcSupportedStandardsResponseSchema.safeParse(data);

      if (
        isSupportedStandards &&
        id === supportedStandardsData?.id &&
        nonNullish(supportedStandardsData?.result)
      ) {
        const {
          result: {supportedStandards: result}
        } = supportedStandardsData;
        return {handled: true, result};
      }

      return {handled: false};
    };

    const postRequest = (id: RpcId): void => {
      requestSupportedStandards({
        popup: this.#popup,
        origin: this.#origin,
        id
      });
    };

    return await this.request<IcrcSupportedStandards>({options, postRequest, handleMessage});
  };
}
