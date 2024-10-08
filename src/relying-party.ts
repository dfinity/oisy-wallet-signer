import {assertNonNullish, nonNullish, notEmptyString} from '@dfinity/utils';
import {
  RELYING_PARTY_CHECK_WALLET_STATUS_INTERVAL,
  RELYING_PARTY_CONNECT_TIMEOUT_IN_MILLISECONDS,
  RELYING_PARTY_DEFAULT_SCOPES,
  RELYING_PARTY_TIMEOUT_ACCOUNTS,
  RELYING_PARTY_TIMEOUT_CALL_CANISTER,
  RELYING_PARTY_TIMEOUT_PERMISSIONS,
  RELYING_PARTY_TIMEOUT_REQUEST_PERMISSIONS,
  RELYING_PARTY_TIMEOUT_REQUEST_STATUS,
  RELYING_PARTY_TIMEOUT_REQUEST_SUPPORTED_STANDARD
} from './constants/relying-party.constants';
import {DEFAULT_SIGNER_WINDOW_TOP_RIGHT} from './constants/window.constants';
import {
  permissions,
  requestAccounts,
  requestCallCanister,
  requestPermissions,
  requestStatus,
  requestSupportedStandards,
  retryRequestStatus
} from './handlers/relying-party.handlers';
import type {IcrcAccounts} from './types/icrc-accounts';
import type {IcrcAnyRequestedScopes, IcrcCallCanisterRequestParams} from './types/icrc-requests';
import {
  IcrcAccountsResponseSchema,
  IcrcCallCanisterResponseSchema,
  IcrcReadyResponseSchema,
  IcrcScopesResponseSchema,
  IcrcSupportedStandardsResponseSchema,
  type IcrcCallCanisterResult,
  type IcrcScopesArray,
  type IcrcSupportedStandards
} from './types/icrc-responses';
import type {Origin} from './types/post-message';
import type {RelyingPartyMessageEvent, RelyingPartyMessageEventData} from './types/relying-party';
import {RelyingPartyResponseError} from './types/relying-party-errors';
import {RelyingPartyOptionsSchema, type RelyingPartyOptions} from './types/relying-party-options';
import {
  RelyingPartyRequestOptionsSchema,
  type RelyingPartyRequestOptions,
  type RelyingPartyRequestOptionsWithTimeout
} from './types/relying-party-requests';
import {
  RpcResponseWithErrorSchema,
  RpcResponseWithResultOrErrorSchema,
  type RpcId
} from './types/rpc';
import type {ReadyOrError} from './utils/timeout.utils';
import {windowFeatures} from './utils/window.utils';

type WalletStatus = 'connected' | 'disconnected';

export class RelyingParty {
  readonly #origin: Origin;
  readonly #popup: Window;

  readonly #onDisconnect;

  #walletStatus: WalletStatus = 'connected';
  readonly #walletStatusInterval: NodeJS.Timeout;

  // TODO: maybe we also want to make the relying party a bit more opiniated in the sense that on connect or each time a request is sent, we can first check if the desired standards is supported.
  // e.g. I'm the client and I ask for "accounts" but actually the signer does not support accounts.

  protected constructor({
    origin,
    popup,
    onDisconnect
  }: {origin: Origin; popup: Window} & Pick<RelyingPartyOptions, 'onDisconnect'>) {
    this.#origin = origin;
    this.#popup = popup;

    this.#onDisconnect = onDisconnect;

    this.#walletStatus = 'connected';
    this.#walletStatusInterval = setInterval(
      this.checkWalletStatusCallback,
      RELYING_PARTY_CHECK_WALLET_STATUS_INTERVAL
    );
  }

  // TODO: create an opinionated extends of RelyingParty which does connect + request accounts in one short
  // According Pete during UX review, this is the standard wallet UX people are expecting.
  // IcpWallet extends SomethingNew extends RelyingParty

  /**
   * Establishes a connection with a signer.
   *
   * @static
   * @param {RelyingPartyOptions} options - The options to initialize the signer.
   * @returns {Promise<RelyingParty>} A promise that resolves to an object, which can be used to interact with the signer when it is connected.
   */
  static async connect({onDisconnect, ...rest}: RelyingPartyOptions): Promise<RelyingParty> {
    return await this.connectSigner({
      options: rest,
      init: (params: {origin: Origin; popup: Window}) =>
        new RelyingParty({
          ...params,
          onDisconnect
        })
    });
  }

  protected static async connectSigner<T extends RelyingParty>({
    options,
    init
  }: {
    options: RelyingPartyOptions;
    init: (params: {origin: Origin; popup: Window}) => T;
  }): Promise<T> {
    const {success: optionsSuccess, error} = RelyingPartyOptionsSchema.safeParse(options);

    if (!optionsSuccess) {
      throw new Error(`Options cannot be parsed: ${error?.message ?? ''}`);
    }

    const {url, windowOptions, connectionOptions} = options;

    const popupFeatures =
      typeof windowOptions === 'string'
        ? windowOptions
        : windowFeatures(windowOptions ?? DEFAULT_SIGNER_WINDOW_TOP_RIGHT);

    const popup = window.open(url, 'relyingPartyWindow', popupFeatures);

    assertNonNullish(popup, 'Unable to open the signer window.');

    const close = (): void => {
      popup.close();
    };

    class MessageError extends Error {}

    let response: T | MessageError | undefined;

    const onMessage = ({origin, data: msgData}: MessageEvent): void => {
      const {success} = RpcResponseWithResultOrErrorSchema.safeParse(msgData);

      if (!success) {
        // We are only interested in JSON-RPC messages, so we are ignoring any other messages emitted at the window level, as the consumer might be using other events.
        return;
      }

      let expectedOrigin: string;

      try {
        const {origin: relyingPartyOrigin} = new URL(url);
        expectedOrigin = relyingPartyOrigin;
      } catch (err: unknown) {
        // Unlikely to happen if window.open succeeded
        response = new MessageError(
          `The origin ${origin} of the signer URL ${url} cannot be parsed.`
        );
        return;
      }

      // In our test suite, origin is set to empty string when the message originate from the same window - i.e. when retryRequestStatus are emitted.// In our test suite, the origin is set to an empty string when the message originates from the same window. This occurs when `retryRequestStatus` events are emitted to `*`.
      if (notEmptyString(origin) && origin !== expectedOrigin) {
        response = new MessageError(
          `The response origin ${origin} does not match the requested signer URL ${url}.`
        );
        return;
      }

      const {success: isWalletReady} = IcrcReadyResponseSchema.safeParse(msgData);
      if (isWalletReady) {
        response = init({origin, popup});
      }
    };

    window.addEventListener('message', onMessage);

    const disconnect = (): void => {
      window.removeEventListener('message', onMessage);

      // TODO: it should maybe also automatically close the window on disconnect?
    };

    const connect = async (): Promise<T> => {
      const result = await retryRequestStatus({
        popup,
        isReady: (): ReadyOrError | 'pending' =>
          nonNullish(response) ? (response instanceof RelyingParty ? 'ready' : 'error') : 'pending',
        id: crypto.randomUUID(),
        timeoutInMilliseconds:
          connectionOptions?.timeoutInMilliseconds ?? RELYING_PARTY_CONNECT_TIMEOUT_IN_MILLISECONDS,
        intervalInMilliseconds: connectionOptions?.pollingIntervalInMilliseconds
      });

      if (result === 'timeout') {
        throw new Error('Connection timeout. Unable to connect to the signer.');
      }

      assertNonNullish(
        response,
        'Unexpected error. The request status succeeded, but the signer response is not defined.'
      );

      if (response instanceof MessageError) {
        throw response;
      }

      return response;
    };

    try {
      return await connect();
    } catch (err: unknown) {
      // We close the popup only in case of an error. If the connection is successful, the developers will interact with the relying party and are responsible for disconnecting it.
      close();

      throw err;
    } finally {
      // We remove the event listener because this implementation scopes message exchanges to individual functions. Each function subscribes to messages, notifies the relying party, and waits for a response.
      disconnect();
    }
  }

  /**
   * Disconnects the signer by closing the associated popup window.
   *
   * @returns {Promise<void>} A promise that resolves when the signer has been successfully disconnected.
   */
  disconnect = async (): Promise<void> => {
    clearInterval(this.#walletStatusInterval);
    this.#popup.close();
    this.#onDisconnect?.();
  };

  private checkWalletStatusCallback = (): void => {
    void this.checkWalletStatus();
  };

  private async checkWalletStatus() {
    const handleMessage = async ({
      data,
      id
    }: {
      data: RelyingPartyMessageEventData;
      id: RpcId;
    }): Promise<{handled: boolean; result: WalletStatus}> => {
      const {success: isWalletReady, data: walletReadyData} =
        IcrcReadyResponseSchema.safeParse(data);
      if (isWalletReady && id === walletReadyData?.id) {
        return {handled: true, result: 'connected'};
      }

      // This can only happen in the rare event that the Wallet is disconnected immediately after the postMessage inquiring about the status is emitted.
      return {handled: true, result: 'disconnected'};
    };

    const postRequest = (id: RpcId): void => {
      requestStatus({
        popup: this.#popup,
        origin: this.#origin,
        id
      });
    };

    const checkWalletStatus = async (): Promise<WalletStatus> => {
      try {
        return await this.request<WalletStatus>({
          options: {
            timeoutInMilliseconds: RELYING_PARTY_TIMEOUT_REQUEST_STATUS
          },
          postRequest,
          handleMessage
        });
      } catch (_err: unknown) {
        return 'disconnected';
      }
    };

    this.#walletStatus = await checkWalletStatus();

    if (this.#walletStatus === 'connected') {
      return;
    }

    await this.disconnect();
  }

  /**
   * Sends an asynchronous request to the signer and handles the response with the provided handlers.
   *
   * @template T - The type of the result expected from the response.
   *
   * @param {Object} params - Parameters for the request.
   * @param {RelyingPartyRequestOptions} params.options - Options for configuring the signer request.
   * @param {(id: RpcId) => void} params.postRequest - The request function that sends the request to the signer using either the provided ID or a generated ID.
   * @param {(params: { data: RelyingPartyMessageEventData; id: RpcId }) => Promise<{ handled: boolean; result?: T }>} params.handleMessage -
   *        A function to handle incoming messages, which should return an object indicating whether the message was handled and optionally include the result. If both `handled` is `true` and the `result` is not `null`, the process is disconnected, i.e., no more listeners will await an answer from the relying party.
   *
   * @returns {Promise<T>} A promise that resolves with the result of the request.
   *
   * @throws {Error} If the signer request options cannot be parsed or if the request times out.
   *
   * @private
   */
  private readonly request = async <T>({
    options,
    postRequest,
    handleMessage
  }: {
    options: Omit<RelyingPartyRequestOptions, 'timeoutInMilliseconds'> &
      Required<Pick<RelyingPartyRequestOptions, 'timeoutInMilliseconds'>>;
    postRequest: (id: RpcId) => void;
    handleMessage: (params: {
      data: RelyingPartyMessageEventData;
      id: RpcId;
    }) => Promise<{handled: boolean; result?: T}>;
  }): Promise<T> =>
    await new Promise<T>((resolve, reject) => {
      // TODO: is window is closed or wallet status is disconnected, the request cannot be performed therefore we should throw an error

      const {success: optionsSuccess, error} = RelyingPartyRequestOptionsSchema.safeParse(options);

      if (!optionsSuccess) {
        throw new Error(`Wallet request options cannot be parsed: ${error?.message ?? ''}`);
      }

      const {requestId: userRequestId, timeoutInMilliseconds} = options;

      const requestId = userRequestId ?? crypto.randomUUID();

      const timeoutId = setTimeout(() => {
        reject(
          new Error(`Request to signer timed out after ${timeoutInMilliseconds} milliseconds.`)
        );
        disconnect();
      }, timeoutInMilliseconds);

      const onMessage = async ({origin, data}: RelyingPartyMessageEvent): Promise<void> => {
        const {success} = RpcResponseWithResultOrErrorSchema.safeParse(data);

        if (!success) {
          // We are only interested in JSON-RPC messages, so we are ignoring any other messages emitted at the window level, as the consumer might be using other events.
          return;
        }

        if (notEmptyString(origin) && origin !== this.#origin) {
          reject(
            new Error(
              `The response origin ${origin} does not match the signer origin ${this.#origin}.`
            )
          );

          disconnect();
          return;
        }

        const {handled, result} = await handleMessage({data, id: requestId});

        if (handled && nonNullish(result)) {
          resolve(result);
          disconnect();
          return;
        }

        const checkError = this.handleErrorMessage({data, id: requestId});

        if (!checkError.valid) {
          reject(checkError.error);
          disconnect();
        }
      };

      const onMessageListener = (message: RelyingPartyMessageEvent): void => {
        void onMessage(message);
      };

      window.addEventListener('message', onMessageListener);

      const disconnect = (): void => {
        clearTimeout(timeoutId);
        window.removeEventListener('message', onMessageListener);
      };

      postRequest(requestId);
    });

  /**
   * List the standards supported by the signer.
   *
   * @async
   * @param {RelyingPartyRequestOptions} options - The options for the signer request, which may include parameters such as timeout settings and other request-specific configurations.
   * @returns {Promise<IcrcSupportedStandards>} A promise that resolves to an object containing the supported ICRC standards by the relying party. This includes details about each standard that the relying party can handle.
   * @see [ICRC25 Supported Standards](https://github.com/dfinity/wg-identity-authentication/blob/main/topics/icrc_25_signer_interaction_standard.md#icrc25_supported_standards)
   */
  supportedStandards = async ({
    options: {timeoutInMilliseconds, ...rest} = {}
  }: {options?: RelyingPartyRequestOptions} = {}): Promise<IcrcSupportedStandards> => {
    const handleMessage = async ({
      data,
      id
    }: {
      data: RelyingPartyMessageEventData;
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

    return await this.request<IcrcSupportedStandards>({
      options: {
        timeoutInMilliseconds:
          timeoutInMilliseconds ?? RELYING_PARTY_TIMEOUT_REQUEST_SUPPORTED_STANDARD,
        ...rest
      },
      postRequest,
      handleMessage
    });
  };

  /**
   * Query the state of all permissions of the signer.
   *
   * @async
   * @param {RelyingPartyRequestOptions} options - The options for the signer request, which may include parameters such as timeout settings and other request-specific configurations.
   * @returns {Promise<IcrcScopes>} A promise that resolves to all permissions the signer knows about. The result might be empty if no permissions were ever requested or if the permissions are outdated.
   * @see [ICRC25 Permissions](https://github.com/dfinity/wg-identity-authentication/blob/main/topics/icrc_25_signer_interaction_standard.md#icrc25_permissions)
   */
  permissions = async ({
    options: {timeoutInMilliseconds, ...rest} = {}
  }: {
    options?: RelyingPartyRequestOptions;
  } = {}): Promise<IcrcScopesArray> => {
    const postRequest = (id: RpcId): void => {
      permissions({
        popup: this.#popup,
        origin: this.#origin,
        id
      });
    };

    return await this.requestPermissionsScopes({
      options: {
        timeoutInMilliseconds: timeoutInMilliseconds ?? RELYING_PARTY_TIMEOUT_PERMISSIONS,
        ...rest
      },
      postRequest
    });
  };

  /**
   * Request permissions from the signer.
   *
   * @async
   * @param {Object} args - The arguments object.
   * @param {RelyingPartyRequestOptions} [args.options] - The options for the signer request, which may include parameters such as timeout settings and other request-specific configurations.
   * @param {Partial<IcrcAnyRequestedScopes>} [args.params] - The specific scopes being requested from the signer. These define the permissions that the signer may grant.
   * @returns {Promise<IcrcScopesArray>} A promise that resolves to the permissions that were confirmed by the user of the signer.
   * @see [ICRC25 Request Permissions](https://github.com/dfinity/wg-identity-authentication/blob/main/topics/icrc_25_signer_interaction_standard.md#icrc25_request_permissions)
   */
  requestPermissions = async ({
    options: {timeoutInMilliseconds, ...rest} = {},
    params
  }: {
    options?: RelyingPartyRequestOptions;
    params?: IcrcAnyRequestedScopes;
  } = {}): Promise<IcrcScopesArray> => {
    const postRequest = (id: RpcId): void => {
      requestPermissions({
        popup: this.#popup,
        origin: this.#origin,
        id,
        params: params ?? RELYING_PARTY_DEFAULT_SCOPES
      });
    };

    return await this.requestPermissionsScopes({
      options: {
        timeoutInMilliseconds: timeoutInMilliseconds ?? RELYING_PARTY_TIMEOUT_REQUEST_PERMISSIONS,
        ...rest
      },
      postRequest
    });
  };

  private readonly requestPermissionsScopes = async ({
    options,
    postRequest
  }: {
    options: RelyingPartyRequestOptionsWithTimeout;
    postRequest: (id: RpcId) => void;
  }): Promise<IcrcScopesArray> => {
    const handleMessage = async ({
      data,
      id
    }: {
      data: RelyingPartyMessageEventData;
      id: RpcId;
    }): Promise<{handled: boolean; result?: IcrcScopesArray}> => {
      const {success: isRequestPermissions, data: requestPermissionsData} =
        IcrcScopesResponseSchema.safeParse(data);

      if (
        isRequestPermissions &&
        id === requestPermissionsData?.id &&
        nonNullish(requestPermissionsData?.result)
      ) {
        const {
          result: {scopes}
        } = requestPermissionsData;

        return {handled: true, result: scopes};
      }

      return {handled: false};
    };

    return await this.request<IcrcScopesArray>({
      options,
      postRequest,
      handleMessage
    });
  };

  /**
   * List the accounts supported by the signer.
   *
   * @async
   * @param {RelyingPartyRequestOptions} options - The options for the signer request, which may include parameters such as timeout settings and other request-specific configurations.
   * @returns {Promise<IcrcAccounts>} A promise that resolves to an object containing the supported ICRC accounts by the signer.
   * @see [ICRC27 Get Accounts](https://github.com/dfinity/wg-identity-authentication/blob/main/topics/icrc_27_accounts.md)
   */
  accounts = async ({
    options: {timeoutInMilliseconds, ...rest} = {}
  }: {options?: RelyingPartyRequestOptions} = {}): Promise<IcrcAccounts> => {
    const handleMessage = async ({
      data,
      id
    }: {
      data: RelyingPartyMessageEventData;
      id: RpcId;
    }): Promise<{handled: boolean; result?: IcrcAccounts}> => {
      const {success: isAccounts, data: accountsData} = IcrcAccountsResponseSchema.safeParse(data);

      if (isAccounts && id === accountsData?.id && nonNullish(accountsData?.result)) {
        const {
          result: {accounts: result}
        } = accountsData;
        return {handled: true, result};
      }

      return {handled: false};
    };

    const postRequest = (id: RpcId): void => {
      requestAccounts({
        popup: this.#popup,
        origin: this.#origin,
        id
      });
    };

    return await this.request<IcrcAccounts>({
      options: {
        timeoutInMilliseconds: timeoutInMilliseconds ?? RELYING_PARTY_TIMEOUT_ACCOUNTS,
        ...rest
      },
      postRequest,
      handleMessage
    });
  };

  /**
   * Call a canister method via the signer.
   *
   * @async
   * @template T - The type of the argument being passed to the canister call.
   * @param {Object} args - The arguments for the call.
   * @param {IcrcCallCanisterRequestParams} args.params - The parameters required to call the canister, including the canister ID, method name, and the encoded argument payload.
   * @param {RelyingPartyRequestOptions} [args.options] - The options for the signer request, which may include parameters such as timeout settings and other request-specific configurations.
   * @returns {Promise<IcrcCallCanisterResult>} A promise that resolves to the result of the canister call.
   * @see [ICRC49 Call Canister](https://github.com/dfinity/wg-identity-authentication/blob/main/topics/icrc_49_call_canister.md)
   */
  call = async ({
    options: {timeoutInMilliseconds, ...rest} = {},
    params
  }: {
    options?: RelyingPartyRequestOptions;
    params: IcrcCallCanisterRequestParams;
  }): Promise<IcrcCallCanisterResult> => {
    const handleMessage = async ({
      data,
      id
    }: {
      data: RelyingPartyMessageEventData;
      id: RpcId;
    }): Promise<{handled: boolean; result?: IcrcCallCanisterResult}> => {
      const {success: isCallCanister, data: resultData} =
        IcrcCallCanisterResponseSchema.safeParse(data);

      if (isCallCanister && id === resultData?.id && nonNullish(resultData?.result)) {
        const {result} = resultData;
        return {handled: true, result};
      }

      return {handled: false};
    };

    // TODO: Automatically generate a nonce if not provided by the consumer.
    // TODO: Improve typings. Externally, it can be undefined, but internally it should not be.
    // TODO: Assert the nonce during the decoding of the response.

    const postRequest = (id: RpcId): void => {
      requestCallCanister({
        popup: this.#popup,
        origin: this.#origin,
        id,
        params
      });
    };

    return await this.request<IcrcCallCanisterResult>({
      options: {
        timeoutInMilliseconds: timeoutInMilliseconds ?? RELYING_PARTY_TIMEOUT_CALL_CANISTER,
        ...rest
      },
      postRequest,
      handleMessage
    });
  };

  private readonly handleErrorMessage = ({
    data,
    id
  }: {
    data: RelyingPartyMessageEventData;
    id: RpcId;
  }): {valid: true} | {valid: false; error: RelyingPartyResponseError | Error} => {
    const {success: isError, data: errorData} = RpcResponseWithErrorSchema.safeParse(data);

    if (!isError || id !== errorData?.id) {
      return {valid: true};
    }

    return {
      valid: false,
      error: new RelyingPartyResponseError(errorData.error)
    };
  };
}
