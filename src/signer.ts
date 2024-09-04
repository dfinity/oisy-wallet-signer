import {assertNonNullish, isNullish, nonNullish} from '@dfinity/utils';
import {resetActors} from './api/actors.api';
import {consentMessage} from './api/canister.api';
import {
  ICRC25_REQUEST_PERMISSIONS,
  ICRC27_ACCOUNTS,
  ICRC49_CALL_CANISTER
} from './constants/icrc.constants';
import {SIGNER_DEFAULT_SCOPES, SignerErrorCode} from './constants/signer.constants';
import {icrc21_consent_info} from './declarations/icrc-21';
import {
  notifyAccounts,
  notifyError,
  notifyErrorPermissionNotGranted,
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
  IcrcAccountsRequestSchema,
  IcrcCallCanisterRequestParams,
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
  type IcrcApproveMethod,
  type IcrcPermissionState,
  type IcrcScopedMethod
} from './types/icrc-standards';
import {RpcRequestSchema, type RpcId} from './types/rpc';
import type {SignerMessageEvent} from './types/signer';
import {IdentityNotAnonymous, SignerHost, SignerOptions} from './types/signer-options';
import {
  AccountsPromptSchema,
  ConsentMessageAnswer,
  ConsentMessagePromptSchema,
  PermissionsPromptSchema,
  type AccountsConfirmation,
  type AccountsPrompt,
  type ConsentMessagePrompt,
  type PermissionsConfirmation,
  type PermissionsPrompt
} from './types/signer-prompts';

class MissingPromptError extends Error {}

export class Signer {
  readonly #owner: IdentityNotAnonymous;
  readonly #host: SignerHost;

  #walletOrigin: string | undefined | null;

  #permissionsPrompt: PermissionsPrompt | undefined;
  #accountsPrompt: AccountsPrompt | undefined;
  #consentMessagePrompt: ConsentMessagePrompt | undefined;

  private constructor({owner, host}: SignerOptions) {
    this.#owner = owner;
    this.#host = host;

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
    resetActors();
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

    const {handled: callCanisterHandled} = await this.handleCallCanister(message);
    if (callCanisterHandled) {
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
    prompt: PermissionsPrompt | AccountsPrompt | ConsentMessagePrompt;
  }): void => {
    // TODO: maybe we should replace method here with another custom enum or type, that would be maybe a bit more comprehensive?
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
      case ICRC49_CALL_CANISTER: {
        ConsentMessagePromptSchema.parse(prompt);
        this.#consentMessagePrompt = prompt as ConsentMessagePrompt;
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

      const scopes = readSessionValidScopes({owner: this.#owner.getPrincipal(), origin});

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

    saveSessionScopes({owner: this.#owner.getPrincipal(), origin: this.#walletOrigin, scopes});
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
    origin
  }: SignerMessageEvent): Promise<{handled: boolean}> {
    const {success: isCallCanisterRequest, data: callData} =
      IcrcCallCanisterRequestSchema.safeParse(data);

    if (isCallCanisterRequest) {
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

      // TODO: asserting that the sender = owner of the accounts = principal derived by II in the signer
      // i.e. sender === this.#owner

      const {result: userConsent} = await this.assertAndPromptConsentMessage({requestId, params});

      if (userConsent !== 'approved') {
        return {handled: true};
      }

      // TODO: call canister

      return {handled: true};
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
      owner: this.#owner.getPrincipal(),
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

  private async assertAndPromptConsentMessage({
    requestId,
    params: {canisterId, method, arg, sender}
  }: {
    params: IcrcCallCanisterRequestParams;
    requestId: RpcId;
  }): Promise<{result: 'approved' | 'rejected' | 'error'}> {
    try {
      const response = await consentMessage({
        owner: this.#owner,
        host: this.#host,
        canisterId,
        request: {
          method,
          arg,
          // TODO: consumer should be able to define user_preferences
          user_preferences: {
            metadata: {
              language: 'en',
              utc_offset_minutes: []
            },
            device_spec: []
          }
        }
      });

      console.log('----------------->', response);

      if ('Err' in response) {
        // TODO: notify error
        return {result: 'error'};
      }

      return await this.promptConsentMessage(response.Ok);
    } catch (err: unknown) {
      // TODO: notify error
      return {result: 'error'};
    }
  }

  private async promptConsentMessage(
    consentInfo: icrc21_consent_info
  ): Promise<{result: 'approved' | 'rejected'}> {
    const promise = new Promise<{result: 'approved' | 'rejected'}>((resolve, reject) => {
      const approve: ConsentMessageAnswer = () => {
        resolve({result: 'approved'});
      };

      const userReject: ConsentMessageAnswer = () => {
        resolve({result: 'rejected'});
      };

      // The consumer currently has no way to unregister the prompt, so we know that it is defined. However, to be future-proof, it's better to ensure it is defined.
      if (isNullish(this.#consentMessagePrompt)) {
        reject(new MissingPromptError());
        return;
      }

      this.#consentMessagePrompt({approve, reject: userReject, consentInfo});
    });

    return await promise;
  }
}
