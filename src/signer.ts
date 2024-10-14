import {assertNonNullish, isNullish, nonNullish} from '@dfinity/utils';
import {
  ICRC21_CALL_CONSENT_MESSAGE,
  ICRC25_REQUEST_PERMISSIONS,
  ICRC27_ACCOUNTS,
  ICRC49_CALL_CANISTER
} from './constants/icrc.constants';
import {SIGNER_DEFAULT_SCOPES, SignerErrorCode} from './constants/signer.constants';
import {
  notifyErrorActionAborted,
  notifyErrorBusy,
  notifyErrorMissingPrompt,
  notifyErrorPermissionNotGranted,
  notifyErrorRequestNotSupported
} from './handlers/signer-errors.handlers';
import {
  notifyAccounts as notifyAccountsHandlers,
  notifyPermissionScopes,
  notifyReady,
  notifySupportedStandards,
  type NotifyPermissions
} from './handlers/signer-success.handlers';
import {notifyError} from './handlers/signer.handlers';
import {SignerService} from './services/signer.service';
import {
  readSessionValidScopes,
  saveSessionScopes,
  sessionScopeState
} from './sessions/signer.sessions';
import type {IcrcAccounts} from './types/icrc-accounts';
import {
  IcrcAccountsRequestSchema,
  IcrcCallCanisterRequestSchema,
  IcrcPermissionsRequestSchema,
  IcrcRequestAnyPermissionsRequestSchema,
  IcrcStatusRequestSchema,
  IcrcSupportedStandardsRequestSchema
} from './types/icrc-requests';
import type {IcrcScope, IcrcScopesArray} from './types/icrc-responses';
import {
  IcrcPermissionStateSchema,
  IcrcScopedMethodSchema,
  type IcrcPermissionState,
  type IcrcScopedMethod
} from './types/icrc-standards';
import type {Origin} from './types/post-message';
import {RpcRequestSchema, type RpcId} from './types/rpc';
import type {SignerMessageEvent} from './types/signer';
import {MissingPromptError} from './types/signer-errors';
import type {Notify} from './types/signer-handlers';
import type {SignerOptions} from './types/signer-options';
import {
  AccountsPromptSchema,
  CallCanisterPromptSchema,
  ConsentMessagePromptSchema,
  PermissionsPromptSchema,
  type AccountsApproval,
  type AccountsPrompt,
  type AccountsPromptPayload,
  type CallCanisterPrompt,
  type ConsentMessagePrompt,
  type PermissionsConfirmation,
  type PermissionsPrompt,
  type PermissionsPromptPayload,
  type Prompts,
  type RegisterPrompts,
  type Rejection
} from './types/signer-prompts';

export class Signer {
  readonly #signerOptions: SignerOptions;

  // eslint-disable-next-line local-rules/use-option-type-wrapper
  #walletOrigin: string | undefined | null;

  #permissionsPrompt: PermissionsPrompt | undefined;
  #accountsPrompt: AccountsPrompt | undefined;
  #consentMessagePrompt: ConsentMessagePrompt | undefined;
  #callCanisterPrompt: CallCanisterPrompt | undefined;

  // TODO: improve implementation to avoid an unexpected misusage in the future where an issue in the code would lead the busy flag to be reset to idle while effectively still being busy
  #busy = false;

  readonly #signerService = new SignerService();

  private constructor(options: SignerOptions) {
    this.#signerOptions = options;

    window.addEventListener('message', this.onMessageListener);
  }

  /**
   * Creates a signer that listens and communicates with a relying party.
   *
   * @static
   * @param {SignerOptions} options - The options for the signer.
   * @returns {Signer} The connected signer.
   */
  static init(options: SignerOptions): Signer {
    return new Signer(options);
  }

  /**
   * Disconnects the signer, removing the message event listener and cleanup.
   * @returns {void}
   */
  disconnect = (): void => {
    window.removeEventListener('message', this.onMessageListener);
    this.#walletOrigin = null;
  };

  // TODO: onbeforeunload, the signer should notify an error 4001 if and only if there is a pending request at the same time.
  // This means that the signer will have to keep track of its activity.
  // See https://github.com/dfinity/wg-identity-authentication/pull/212

  private readonly onMessageListener = (message: SignerMessageEvent): void => {
    void this.onMessage(message);
  };

  private readonly onMessage = async (message: SignerMessageEvent): Promise<void> => {
    const {data, origin} = message;

    const {success, data: requestData} = RpcRequestSchema.safeParse(data);

    if (!success) {
      // We are only interested in JSON-RPC messages, so we are ignoring any other messages emitted at the window level, as the consumer might be using other events.
      return;
    }

    const {busy} = this.assertNotBusy(message);
    if (busy) {
      return;
    }

    // TODO: wrap a try catch around all handler and notify "Unexpected exception" in case if issues

    try {
      const {handled} = await this.handleMessage(message);
      if (handled) {
        return;
      }

      notifyErrorRequestNotSupported({
        id: requestData?.id ?? null,
        origin
      });
    } finally {
      this.setIdle();
    }
  };

  private async handleMessage(message: SignerMessageEvent): Promise<{handled: boolean}> {
    const {handled: statusRequestHandled} = this.handleStatusRequest(message);
    if (statusRequestHandled) {
      return {handled: true};
    }

    // At this point the connection with the relying party should have been initialized and the origin should be set.
    const {valid} = this.assertNotUndefinedAndSameOrigin(message);
    if (!valid) {
      return {handled: true};
    }

    const {handled: supportedStandardsRequestHandled} = this.handleSupportedStandards(message);
    if (supportedStandardsRequestHandled) {
      return {handled: true};
    }

    const {handled: permissionsHandled} = this.handlePermissionsRequest(message);
    if (permissionsHandled) {
      return {handled: true};
    }

    const {handled: requestsPermissionsHandled} =
      await this.handleRequestPermissionsRequest(message);
    if (requestsPermissionsHandled) {
      return {handled: true};
    }

    const {handled: accountsHandled} = await this.handleAccounts(message);
    if (accountsHandled) {
      return {handled: true};
    }

    const {handled: callCanisterHandled} = await this.handleCallCanister(message);
    if (callCanisterHandled) {
      return {handled: true};
    }

    return {handled: false};
  }

  private setWalletOrigin({origin}: Pick<SignerMessageEvent, 'origin'>) {
    // We do not reassign the origin with the same value if it is already set. It is not a significant performance win.
    if (nonNullish(this.#walletOrigin)) {
      return;
    }

    this.#walletOrigin = origin;
  }

  /**
   * When establishing a connection, validates the origin of a message event to ensure it matches the existing wallet origin - i.e. subsequent status requests - or is undefined - i.e. first status request.
   * If the origin is invalid, it sends an error notification with the appropriate error code and message.
   *
   * @private
   * @param {object} event - The message event to validate.
   * @param {any} event.data - The data sent in the message event.
   * @param {string} event.origin - The origin of the message event.
   *
   * @returns {object} An object containing a `valid` boolean property.
   * @returns {boolean} returns `true` if the origin is either undefined or matches the expected wallet origin, otherwise returns `false` and notifies the error.
   */
  private assertUndefinedOrSameOrigin({data: msgData, origin}: SignerMessageEvent): {
    valid: boolean;
  } {
    if (nonNullish(this.#walletOrigin) && this.#walletOrigin !== origin) {
      const {data} = RpcRequestSchema.safeParse(msgData);

      notifyError({
        id: data?.id ?? null,
        origin,
        error: {
          code: SignerErrorCode.ORIGIN_ERROR,
          message: `The relying party's origin is not permitted to obtain the status of the signer.`
        }
      });

      return {valid: false};
    }

    return {valid: true};
  }

  /**
   * Checks if the signer is busy and notifies the relying party if it is.
   *
   * This is required for security reason to avoid the consumer of the signer to for example process a call canister while at the same time new permissions are requested.
   *
   * @private
   * @param {object} event - The message event to validate.
   * @param {any} event.data - The data sent in the message event.
   * @param {string} event.origin - The origin of the message event.
   *
   * @returns {object} An object containing a `busy` boolean property.
   * @returns {boolean} returns true` if the signer is busy, otherwise `false`.
   */
  private assertNotBusy({data: msgData, origin}: SignerMessageEvent): {busy: boolean} {
    if (this.#busy) {
      notifyErrorBusy({
        id: msgData?.id ?? null,
        origin
      });
      return {busy: true};
    }

    return {busy: false};
  }

  private async handleWithBusy(
    handler: () => Promise<{handled: boolean}>
  ): Promise<{handled: boolean}> {
    this.#busy = true;

    return await handler();
  }

  private setIdle() {
    this.#busy = false;
  }

  /**
   * Validates that the wallet origin is defined and matches the origin of the message event that established the connection.
   * If the origin is invalid or the wallet origin is not defined, it sends an error notification
   * with the appropriate error code and message.
   *
   * @private
   * @param {object} event - The message event to validate.
   * @param {any} event.data - The data sent in the message event.
   * @param {string} event.origin - The origin of the message event.
   *
   * @returns {object} An object containing a `valid` boolean property.
   * @returns {boolean} returns `true` if the wallet origin is defined and matches the origin of the message event, otherwise returns `false` and notifies the error.
   */
  private assertNotUndefinedAndSameOrigin({data: msgData, origin}: SignerMessageEvent): {
    valid: boolean;
  } {
    if (isNullish(this.#walletOrigin) || this.#walletOrigin !== origin) {
      const {data} = RpcRequestSchema.safeParse(msgData);

      notifyError({
        id: data?.id ?? null,
        origin,
        error: {
          code: SignerErrorCode.ORIGIN_ERROR,
          message: isNullish(this.#walletOrigin)
            ? 'The relying party has not established a connection to the signer.'
            : `The relying party's origin is not allowed to interact with the signer.`
        }
      });

      return {valid: false};
    }

    return {valid: true};
  }

  /**
   * Registers a prompt handler for a specified method in the signer service.
   *
   * @template T
   * @param {RegisterPrompts<T>} options - An object containing the method and corresponding prompt handler.
   * @param {T} options.method - The method for which the prompt handler is being registered. Supported methods include ICRC standards.
   * @param {Prompts[T]} options.prompt - The prompt handler that should be registered. The prompt type depends on the method being registered.
   *
   * @throws {Error} Throws an error if the method is not supported or the prompt type does not match the expected type for the given method.
   *
   * @example
   * // Register a permissions prompt
   * register({
   *   method: 'icrc25_request_permissions', // or alternatively using related constant ICRC25_REQUEST_PERMISSIONS
   *   prompt: (payload) => {
   *     payload.confirm(requestedScopes);
   *   }
   * });
   */
  register = <T extends keyof Prompts>({method, prompt}: RegisterPrompts<T>): void => {
    // TODO: is there a way to avoid casting?
    switch (method) {
      case ICRC21_CALL_CONSENT_MESSAGE: {
        ConsentMessagePromptSchema.parse(prompt);
        this.#consentMessagePrompt = prompt as ConsentMessagePrompt;
        return;
      }
      case ICRC25_REQUEST_PERMISSIONS: {
        PermissionsPromptSchema.parse(prompt);
        this.#permissionsPrompt = prompt as PermissionsPrompt;
        return;
      }
      case ICRC27_ACCOUNTS: {
        AccountsPromptSchema.parse(prompt);
        this.#accountsPrompt = prompt as AccountsPrompt;
        return;
      }
      case ICRC49_CALL_CANISTER: {
        CallCanisterPromptSchema.parse(prompt);
        this.#callCanisterPrompt = prompt as CallCanisterPrompt;
        return;
      }
    }

    throw new Error(
      'The specified method is not supported. Please ensure you are using a supported standard.'
    );
  };

  // TODO: maybe provide a prompt for the developer to get to know when status "ready" was exchanged?

  /**
   * Handles incoming status requests.
   *
   * Parses the message data to determine if it conforms to a status request, sends a notification indicating that the signer is ready and set the origin for asserting subsequent calls.
   *
   * @param {SignerMessageEvent} message - The incoming message event containing the data and origin.
   * @returns {Object} An object with a boolean property `handled` indicating whether the request was handled.
   */
  private handleStatusRequest({data, origin, ...rest}: SignerMessageEvent): {handled: boolean} {
    const {success: isStatusRequest, data: statusData} = IcrcStatusRequestSchema.safeParse(data);

    if (isStatusRequest) {
      const {valid} = this.assertUndefinedOrSameOrigin({data, origin, ...rest});
      if (!valid) {
        return {handled: true};
      }

      const {id} = statusData;
      notifyReady({id, origin});

      this.setWalletOrigin({origin});

      return {handled: true};
    }

    return {handled: false};
  }

  /**
   * Handles incoming messages to list the supported standards.
   *
   * Parses the message data to determine if it conforms to a supported standards request and responds with a notification with the supported standards.
   *
   * @param {SignerMessageEvent} message - The incoming message event containing the data and origin.
   * @returns {Object} An object with a boolean property `handled` indicating whether the request was handled.
   */
  private handleSupportedStandards({data, origin}: SignerMessageEvent): {handled: boolean} {
    const {success: isSupportedStandardsRequest, data: supportedStandardsData} =
      IcrcSupportedStandardsRequestSchema.safeParse(data);

    if (isSupportedStandardsRequest) {
      const {id} = supportedStandardsData;
      notifySupportedStandards({id, origin});
      return {handled: true};
    }

    return {handled: false};
  }

  /**
   * Handles incoming messages to list the permissions.
   *
   * Parses the message data to determine if it conforms to a permissions request and responds with a notification with the scopes of the permissions.
   *
   * @param {SignerMessageEvent} message - The incoming message event containing the data and origin.
   * @returns {Object} An object with a boolean property `handled` indicating whether the request was handled.
   */
  private handlePermissionsRequest({data}: SignerMessageEvent): {handled: boolean} {
    const {success: isPermissionsRequestRequest, data: permissionsRequestData} =
      IcrcPermissionsRequestSchema.safeParse(data);

    if (isPermissionsRequestRequest) {
      const {id} = permissionsRequestData;

      this.emitPermissions({id});

      return {handled: true};
    }

    return {handled: false};
  }

  // TODO: user can answer to permissions prompts with ask_on_use?
  // Maybe it's possible to resolve it without modifying the lib. To be double checked.

  /**
   * Handles incoming messages to request permissions.
   *
   * Parses the message data to determine if it conforms to a request permissions schema. If it does,
   * forwards the parameters to the clients, as requesting permissions requires the user to review
   * and approve or decline them.
   *
   * @param {SignerMessageEvent} message - The incoming message event containing the data and origin.
   * @returns {Object} An object with a boolean property `handled` indicating whether the request was processed as a permissions request.
   */
  private async handleRequestPermissionsRequest({
    data,
    origin
  }: SignerMessageEvent): Promise<{handled: boolean}> {
    const handler = async (): Promise<{handled: boolean}> => {
      const {success: isRequestPermissionsRequest, data: requestPermissionsData} =
        IcrcRequestAnyPermissionsRequestSchema.safeParse(data);

      if (!isRequestPermissionsRequest) {
        return {handled: false};
      }

      const {
        id: requestId,
        params: {scopes: requestedScopes}
      } = requestPermissionsData;

      if (isNullish(this.#permissionsPrompt)) {
        this.assertWalletOriginAndNotifyMissingPromptError(requestId);

        return {handled: true};
      }

      // TODO: In the future, we might want to prompt only if the requested permissions are not already granted. We should prevent the case where the relying party requests permissions without first checking if those permissions have already been granted. Let's see how the signer is used by the community first.
      // TODO: Can the newer version of TypeScript infer "as IcrcScope"?
      const supportedRequestedScopes = requestedScopes
        .filter(
          ({method: requestedMethod}) => IcrcScopedMethodSchema.safeParse(requestedMethod).success
        )
        .map(
          ({method}) =>
            ({
              scope: {method},
              state: IcrcPermissionStateSchema.enum.denied
            }) as const as IcrcScope
        )
        .sort(
          ({scope: {method: methodA}}: IcrcScope, {scope: {method: methodB}}: IcrcScope): number =>
            methodA.localeCompare(methodB)
        );

      // TODO: Maybe validating that the list of requested scopes contains at least one scope would be cool?
      // Additionally, it may be beneficial to define a type that ensures at least one scope is present when responding to permission queries ([IcrcScope, ...IcrcScop[]] in Zod).
      // Overall, it would be handy to enforce a minimum of one permission through types and behavior?

      const promptFn = async (): Promise<void> => {
        const confirmedScopes = await this.promptPermissions({
          requestedScopes: supportedRequestedScopes,
          origin
        });

        this.savePermissions({scopes: confirmedScopes});
        this.emitPermissions({id: requestId});
      };

      await this.prompt({
        requestId,
        promptFn
      });

      return {handled: true};
    };

    return await this.handleWithBusy(handler);
  }

  private async promptPermissions(
    payload: Omit<PermissionsPromptPayload, 'confirm'>
  ): Promise<IcrcScopesArray> {
    const promise = new Promise<IcrcScopesArray>((resolve, reject) => {
      const confirm: PermissionsConfirmation = (scopes) => {
        resolve(scopes);
      };

      // The consumer currently has no way to unregister the prompt, so we know that it is defined. However, to be future-proof, it's better to ensure it is defined.
      if (isNullish(this.#permissionsPrompt)) {
        reject(new MissingPromptError());
        return;
      }

      this.#permissionsPrompt({...payload, confirm});
    });

    return await promise;
  }

  private emitPermissions({id}: Pick<NotifyPermissions, 'id'>): void {
    assertNonNullish(this.#walletOrigin, "The relying party's origin is unknown.");

    const {owner} = this.#signerOptions;

    const scopes = readSessionValidScopes({
      owner: owner.getPrincipal(),
      origin: this.#walletOrigin
    });

    // The relying party should always receive the full list of permissions, and those that have never been requested or have expired should be provided as "ask_on_use".
    const allScopes = [
      ...(scopes ?? []),
      ...SIGNER_DEFAULT_SCOPES.filter(
        ({scope: {method: defaultMethod}}) =>
          (scopes ?? []).find(({scope: {method}}) => method === defaultMethod) === undefined
      )
    ];

    notifyPermissionScopes({
      id,
      origin: this.#walletOrigin,
      scopes: allScopes
    });
  }

  private assertWalletOriginAndNotifyMissingPromptError(id: RpcId | undefined): void {
    assertNonNullish(this.#walletOrigin, "The relying party's origin is unknown.");

    notifyErrorMissingPrompt({
      id: id ?? null,
      origin: this.#walletOrigin
    });
  }

  private savePermissions({scopes}: {scopes: IcrcScopesArray}): void {
    assertNonNullish(this.#walletOrigin, "The relying party's origin is unknown.");

    const {owner} = this.#signerOptions;

    saveSessionScopes({owner: owner.getPrincipal(), origin: this.#walletOrigin, scopes});
  }

  /**
   * Handles incoming messages to list the accounts.
   *
   * Parses the message data to determine if it conforms to a accounts request and responds with the accounts if the permissions are granted.
   *
   * @param {SignerMessageEvent} message - The incoming message event containing the data and origin.
   * @returns {Object} An object with a boolean property `handled` indicating whether the request was handled.
   */
  private async handleAccounts({data, origin}: SignerMessageEvent): Promise<{handled: boolean}> {
    const handler = async (): Promise<{handled: boolean}> => {
      const {success: isAccountsRequest, data: accountsData} =
        IcrcAccountsRequestSchema.safeParse(data);

      if (!isAccountsRequest) {
        return {handled: false};
      }

      const {id: requestId} = accountsData;

      const notifyAccounts = async (): Promise<void> => {
        const promptFn = async (): Promise<void> => {
          const {result, accounts} = await this.promptAccounts({origin});

          if (result === 'rejected') {
            notifyErrorActionAborted({id: requestId, origin});
            return;
          }

          notifyAccountsHandlers({accounts, id: requestId, origin});
        };

        await this.prompt({
          requestId,
          promptFn
        });
      };

      const permission = await this.assertAndPromptPermissions({
        method: ICRC27_ACCOUNTS,
        requestId,
        origin
      });

      switch (permission) {
        case 'denied': {
          notifyErrorPermissionNotGranted({
            id: requestId ?? null,
            origin
          });
          break;
        }
        case 'granted': {
          await notifyAccounts();
          break;
        }
      }

      return {handled: true};
    };

    return await this.handleWithBusy(handler);
  }

  private async prompt({
    requestId,
    promptFn
  }: {
    promptFn: () => Promise<void>;
    requestId: RpcId;
  }): Promise<void> {
    try {
      await promptFn();
    } catch (err: unknown) {
      if (err instanceof MissingPromptError) {
        this.assertWalletOriginAndNotifyMissingPromptError(requestId);
        return;
      }

      throw err;
    }
  }

  // TODO: this can maybe be made generic. It's really similar to promptPermissions.
  private async promptAccounts(
    payload: Omit<AccountsPromptPayload, 'approve' | 'reject'>
  ): Promise<{result: 'approved' | 'rejected'; accounts: IcrcAccounts}> {
    const promise = new Promise<{result: 'approved' | 'rejected'; accounts: IcrcAccounts}>(
      (resolve, reject) => {
        const userReject: Rejection = () => {
          resolve({result: 'rejected', accounts: []});
        };

        const approve: AccountsApproval = (accounts) => {
          resolve({result: 'approved', accounts});
        };

        // The consumer currently has no way to unregister the prompt, so we know that it is defined. However, to be future-proof, it's better to ensure it is defined.
        if (isNullish(this.#accountsPrompt)) {
          reject(new MissingPromptError());
          return;
        }

        this.#accountsPrompt({approve, reject: userReject, ...payload});
      }
    );

    return await promise;
  }

  /**
   * Handles incoming messages to call a canister.
   *
   * Parses the message data to determine if it conforms to a call canister request and responds with the result of the call if the permissions are granted and if the user accept the consent message.
   *
   * @param {SignerMessageEvent} message - The incoming message event containing the data and origin.
   * @returns {Object} An object with a boolean property `handled` indicating whether the request was handled.
   */
  private async handleCallCanister({
    data,
    origin
  }: SignerMessageEvent): Promise<{handled: boolean}> {
    const handler = async (): Promise<{handled: boolean}> => {
      const {success: isCallCanisterRequest, data: callData} =
        IcrcCallCanisterRequestSchema.safeParse(data);

      if (!isCallCanisterRequest) {
        return {handled: false};
      }

      const {id: requestId, params} = callData;

      const permission = await this.assertAndPromptPermissions({
        method: ICRC49_CALL_CANISTER,
        requestId,
        origin
      });

      if (permission === 'denied') {
        notifyErrorPermissionNotGranted({
          id: requestId ?? null,
          origin
        });
        return {handled: true};
      }

      const notify: Notify = {
        id: requestId,
        origin
      };

      const {result: userConsent} = await this.#signerService.assertAndPromptConsentMessage({
        notify,
        params,
        prompt: this.#consentMessagePrompt,
        options: this.#signerOptions
      });

      if (userConsent !== 'approved') {
        return {handled: true};
      }

      await this.#signerService.callCanister({
        notify,
        params,
        options: this.#signerOptions,
        prompt: this.#callCanisterPrompt
      });

      return {handled: true};
    };

    return await this.handleWithBusy(handler);
  }

  /**
   * Asserts the current permission state for the given method and origin. If the permission
   * is set to 'ask_on_use', prompts the user for permission and returns the updated state.
   *
   * @private
   * @async
   * @function
   * @param {Object} params - The parameters for the function.
   * @param {IcrcScopedMethod} params.method - The method for which permissions are being checked.
   * @param {string} params.origin - The origin from where the request is made.
   * @param {RpcId} params.requestId - The unique identifier for the RPC request.
   *
   * @returns {Promise<Omit<IcrcPermissionState, 'ask_on_use'>>} - A promise that resolves to the updated
   * permission state ('granted' or 'denied'), or the current permission if no prompt is needed.
   *
   * @throws {Error} - Throws an error if the permission prompt fails.
   */
  private async assertAndPromptPermissions({
    method,
    origin,
    requestId
  }: {
    method: IcrcScopedMethod;
    origin: Origin;
    requestId: RpcId;
  }): Promise<Omit<IcrcPermissionState, 'ask_on_use'>> {
    const {owner} = this.#signerOptions;

    const currentPermission = sessionScopeState({
      owner: owner.getPrincipal(),
      origin,
      method
    });

    switch (currentPermission) {
      case 'ask_on_use': {
        const promise = new Promise<Omit<IcrcPermissionState, 'ask_on_use'>>((resolve, reject) => {
          const promptFn = async (): Promise<void> => {
            const requestedScopes: IcrcScopesArray = [
              {
                scope: {
                  method
                },
                state: 'denied'
              }
            ];

            const confirmedScopes = await this.promptPermissions({
              requestedScopes,
              origin
            });

            this.savePermissions({scopes: confirmedScopes});

            const approved =
              confirmedScopes.find(
                ({scope: {method: m}, state}) => m === method && state === 'granted'
              ) !== undefined;

            if (approved) {
              resolve('granted');
              return;
            }

            resolve('denied');
          };

          this.prompt({
            requestId,
            promptFn
          }).catch((err) => {
            reject(err);
          });
        });

        return await promise;
      }
      default:
        return currentPermission;
    }
  }
}
