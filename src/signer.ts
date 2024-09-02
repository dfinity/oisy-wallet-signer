import type {Principal} from '@dfinity/principal';
import {assertNonNullish, isNullish, nonNullish} from '@dfinity/utils';
import {ICRC25_REQUEST_PERMISSIONS, ICRC27_ACCOUNTS} from './constants/icrc.constants';
import {SIGNER_DEFAULT_SCOPES, SignerErrorCode} from './constants/signer.constants';
import {
  notifyAccounts,
  notifyError,
  notifyPermissionScopes,
  notifyReady,
  notifySupportedStandards,
  type NotifyAccounts,
  type NotifyPermissions
} from './handlers/signer.handlers';
import {
  readSessionValidScopes,
  saveSessionScopes,
  sessionScopeState
} from './sessions/signer.sessions';
import type {IcrcAccounts} from './types/icrc-accounts';
import {
  IcrcAccountsRequestSchema, IcrcCallCanisterRequestSchema,
  IcrcPermissionsRequestSchema,
  IcrcRequestAnyPermissionsRequestSchema,
  IcrcStatusRequestSchema,
  IcrcSupportedStandardsRequestSchema
} from './types/icrc-requests';
import type {IcrcScope, IcrcScopesArray} from './types/icrc-responses';
import {
  IcrcPermissionStateSchema,
  IcrcScopedMethodSchema,
  type IcrcApproveMethod,
  type IcrcPermissionState,
  type IcrcScopedMethod
} from './types/icrc-standards';
import {RpcRequestSchema, type RpcId} from './types/rpc';
import type {SignerMessageEvent} from './types/signer';
import type {SignerOptions} from './types/signer-options';
import {
  AccountsPromptSchema,
  PermissionsPromptSchema,
  type AccountsConfirmation,
  type AccountsPrompt,
  type PermissionsConfirmation,
  type PermissionsPrompt
} from './types/signer-prompts';

class MissingPromptError extends Error {}

export class Signer {
  readonly #owner: Principal;

  #walletOrigin: string | undefined | null;

  #permissionsPrompt: PermissionsPrompt | undefined;
  #accountsPrompt: AccountsPrompt | undefined;

  private constructor({owner}: SignerOptions) {
    this.#owner = owner;

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
   * Disconnects the signer, removing the message event listener.
   * @returns {void}
   */
  disconnect = (): void => {
    window.removeEventListener('message', this.onMessageListener);
    this.#walletOrigin = null;
  };

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

    this.assertAndSetOrigin(message);

    // TODO: wrap a try catch around all handler and notify "Unexpected exception" in case if issues

    const {handled: statusRequestHandled} = this.handleStatusRequest(message);
    if (statusRequestHandled) {
      return;
    }

    const {handled: supportedStandardsRequestHandled} = this.handleSupportedStandards(message);
    if (supportedStandardsRequestHandled) {
      return;
    }

    const {handled: permissionsHandled} = this.handlePermissionsRequest(message);
    if (permissionsHandled) {
      return;
    }

    const {handled: requestsPermissionsHandled} =
      await this.handleRequestPermissionsRequest(message);
    if (requestsPermissionsHandled) {
      return;
    }

    const {handled: accountsHandled} = await this.handleAccounts(message);
    if (accountsHandled) {
      return;
    }

    notifyError({
      id: requestData?.id ?? null,
      origin,
      error: {
        code: SignerErrorCode.REQUEST_NOT_SUPPORTED,
        message: 'The request sent by the relying party is not supported by the signer.'
      }
    });
  };

  private assertAndSetOrigin({data: msgData, origin}: SignerMessageEvent): void {
    if (nonNullish(this.#walletOrigin) && this.#walletOrigin !== origin) {
      const {data} = RpcRequestSchema.safeParse(msgData);

      notifyError({
        id: data?.id ?? null,
        origin,
        error: {
          code: SignerErrorCode.ORIGIN_ERROR,
          message: `The relying party's origin is not allowed to interact with the signer.`
        }
      });

      return;
    }

    // We do not reassign the origin with the same value if it is already set. It is not a significant performance win.
    if (nonNullish(this.#walletOrigin)) {
      return;
    }

    this.#walletOrigin = origin;
  }

  /**
   * TODO: to be documented when fully implemented.
   */
  register = ({
    method,
    prompt
  }: {
    method: IcrcApproveMethod;
    prompt: PermissionsPrompt | AccountsPrompt;
  }): void => {
    // TODO: is there a way to avoid casting?
    switch (method) {
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
    }

    throw new Error(
      'The specified method is not supported. Please ensure you are using a supported standard.'
    );
  };

  /**
   * Handles incoming status requests.
   *
   * Parses the message data to determine if it conforms to a status request and sends a notification indicating that the signer is ready.
   *
   * @param {SignerMessageEvent} message - The incoming message event containing the data and origin.
   * @returns {Object} An object with a boolean property `handled` indicating whether the request was handled.
   */
  private handleStatusRequest({data, origin}: SignerMessageEvent): {handled: boolean} {
    const {success: isStatusRequest, data: statusData} = IcrcStatusRequestSchema.safeParse(data);

    if (isStatusRequest) {
      const {id} = statusData;
      notifyReady({id, origin});
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
  private handlePermissionsRequest({data, origin}: SignerMessageEvent): {handled: boolean} {
    const {success: isPermissionsRequestRequest, data: permissionsRequestData} =
      IcrcPermissionsRequestSchema.safeParse(data);

    if (isPermissionsRequestRequest) {
      const {id} = permissionsRequestData;

      const scopes = readSessionValidScopes({owner: this.#owner, origin});

      notifyPermissionScopes({
        id,
        origin,
        scopes: scopes ?? SIGNER_DEFAULT_SCOPES
      });
      return {handled: true};
    }

    return {handled: false};
  }

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
    data
  }: SignerMessageEvent): Promise<{handled: boolean}> {
    const {success: isRequestPermissionsRequest, data: requestPermissionsData} =
      IcrcRequestAnyPermissionsRequestSchema.safeParse(data);

    if (isRequestPermissionsRequest) {
      const {
        id: requestId,
        params: {scopes: requestedScopes}
      } = requestPermissionsData;

      if (isNullish(this.#permissionsPrompt)) {
        this.notifyMissingPromptError(requestId);

        return {handled: true};
      }

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
        );

      // TODO: Maybe validating that the list of requested scopes contains at least one scope would be cool?
      // Additionally, it may be beneficial to define a type that ensures at least one scope is present when responding to permission queries ([IcrcScope, ...IcrcScop[]] in Zod).
      // Overall, it would be handy to enforce a minimum of one permission through types and behavior?

      const promptFn = async (): Promise<void> => {
        const confirmedScopes = await this.promptPermissions(supportedRequestedScopes);

        this.emitPermissions({scopes: confirmedScopes, id: requestId});
        this.savePermissions({scopes: confirmedScopes});
      };

      await this.prompt({
        requestId,
        promptFn
      });

      return {handled: true};
    }

    return {handled: false};
  }

  private async promptPermissions(requestedScopes: IcrcScopesArray): Promise<IcrcScopesArray> {
    const promise = new Promise<IcrcScopesArray>((resolve, reject) => {
      const confirmScopes: PermissionsConfirmation = (scopes) => {
        resolve(scopes);
      };

      // The consumer currently has no way to unregister the prompt, so we know that it is defined. However, to be future-proof, it's better to ensure it is defined.
      if (isNullish(this.#permissionsPrompt)) {
        reject(new MissingPromptError());
        return;
      }

      this.#permissionsPrompt({requestedScopes, confirmScopes});
    });

    return await promise;
  }

  private emitPermissions(params: Omit<NotifyPermissions, 'origin'>): void {
    assertNonNullish(this.#walletOrigin, "The relying party's origin is unknown.");

    notifyPermissionScopes({
      ...params,
      origin: this.#walletOrigin
    });
  }

  private notifyMissingPromptError(id: RpcId | undefined): void {
    assertNonNullish(this.#walletOrigin, "The relying party's origin is unknown.");

    notifyError({
      id: id ?? null,
      origin: this.#walletOrigin,
      error: {
        code: SignerErrorCode.PERMISSIONS_PROMPT_NOT_REGISTERED,
        message: 'The signer has not registered a prompt to respond to permission requests.'
      }
    });
  }

  private savePermissions({scopes}: {scopes: IcrcScopesArray}): void {
    assertNonNullish(this.#walletOrigin, "The relying party's origin is unknown.");

    saveSessionScopes({owner: this.#owner, origin: this.#walletOrigin, scopes});
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
    const {success: isAccountsRequest, data: accountsData} =
      IcrcAccountsRequestSchema.safeParse(data);

    if (isAccountsRequest) {
      const {id: requestId} = accountsData;

      const notifyAccounts = async (): Promise<void> => {
        const promptFn = async (): Promise<void> => {
          const accounts = await this.promptAccounts();

          this.emitAccounts({accounts, id: requestId});
        };

        await this.prompt({
          requestId,
          promptFn
        });
      };

      const notifyDeniedAccounts = (): void => {
        notifyError({
          id: requestId ?? null,
          origin,
          error: {
            code: SignerErrorCode.PERMISSION_NOT_GRANTED,
            message:
              'The signer has not granted the necessary permissions to process the request from the relying party.'
          }
        });
      };

      const permission = await this.assertAndPromptPermissions({
        method: ICRC27_ACCOUNTS,
        requestId,
        origin
      });

      switch (permission) {
        case 'denied': {
          notifyDeniedAccounts();
          break;
        }
        case 'granted': {
          await notifyAccounts();
          break;
        }
      }

      return {handled: true};
    }

    return {handled: false};
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
        this.notifyMissingPromptError(requestId);
        return;
      }

      throw err;
    }
  }

  // TODO: this can maybe be made generic. It's really similar to promptPermissions.
  private async promptAccounts(): Promise<IcrcAccounts> {
    const promise = new Promise<IcrcAccounts>((resolve, reject) => {
      const confirmAccounts: AccountsConfirmation = (accounts) => {
        resolve(accounts);
      };

      // The consumer currently has no way to unregister the prompt, so we know that it is defined. However, to be future-proof, it's better to ensure it is defined.
      if (isNullish(this.#accountsPrompt)) {
        reject(new MissingPromptError());
        return;
      }

      this.#accountsPrompt({confirmAccounts});
    });

    return await promise;
  }

  private emitAccounts(params: Omit<NotifyAccounts, 'origin'>): void {
    assertNonNullish(this.#walletOrigin, "The relying party's origin is unknown.");

    notifyAccounts({
      origin: this.#walletOrigin,
      ...params
    });
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
    origin: _
  }: SignerMessageEvent): Promise<{handled: boolean}> {
    const {success: isCallCanisterRequest, data: callData} =
      IcrcCallCanisterRequestSchema.safeParse(data);

    if (isCallCanisterRequest) {
      const {id: _requestId} = callData;
    }

    return {handled: false};
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
    origin: string;
    requestId: RpcId;
  }): Promise<Omit<IcrcPermissionState, 'ask_on_use'>> {
    const currentPermission = sessionScopeState({
      owner: this.#owner,
      origin,
      method
    });

    switch (currentPermission) {
      case 'ask_on_use': {
        const promise = new Promise<Omit<IcrcPermissionState, 'ask_on_use'>>((resolve, reject) => {
          const promptFn = async (): Promise<void> => {
            const confirmedScopes = await this.promptPermissions([
              {
                scope: {
                  method
                },
                state: 'denied'
              }
            ]);

            this.savePermissions({scopes: confirmedScopes});

            const approved =
              confirmedScopes.find(
                ({scope: {method}, state}) => method === ICRC27_ACCOUNTS && state === 'granted'
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
