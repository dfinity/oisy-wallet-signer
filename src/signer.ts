import type {Principal} from '@dfinity/principal';
import {assertNonNullish, isNullish, nonNullish} from '@dfinity/utils';
import {ICRC25_REQUEST_PERMISSIONS} from './constants/icrc.constants';
import {SIGNER_DEFAULT_SCOPES, SignerErrorCode} from './constants/signer.constants';
import {
  notifyError,
  notifyPermissionScopes,
  notifyReady,
  notifySupportedStandards
} from './handlers/signer.handlers';
import {readValidPermissions, savePermissions} from './sessions/signer.sessions';
import {
  IcrcWalletPermissionStateSchema,
  IcrcWalletScopedMethodSchema,
  type IcrcWalletApproveMethod
} from './types/icrc';
import {
  IcrcPermissionsRequestSchema,
  IcrcRequestAnyPermissionsRequestSchema,
  IcrcStatusRequestSchema,
  IcrcSupportedStandardsRequestSchema
} from './types/icrc-requests';
import type {IcrcScope, IcrcScopesArray} from './types/icrc-responses';
import {RpcRequestSchema} from './types/rpc';
import type {SignerMessageEvent} from './types/signer';
import type {SignerOptions} from './types/signer-options';
import {
  PermissionsConfirmation,
  PermissionsPrompt,
  PermissionsPromptSchema
} from './types/signer-prompts';
import type {RequestPermissionPayload} from './types/signer-subscribers';

export class Signer {
  readonly #owner: Principal;

  #walletOrigin: string | undefined | null;

  #permissionsPrompt: PermissionsPrompt | undefined;

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
    method: IcrcWalletApproveMethod;
    prompt: PermissionsPrompt;
  }): (() => void) => {
    switch (method) {
      case ICRC25_REQUEST_PERMISSIONS: {
        PermissionsPromptSchema.parse(prompt);
        this.#permissionsPrompt = prompt;
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

      const permissions = readValidPermissions({owner: this.#owner, origin});

      notifyPermissionScopes({
        id,
        origin,
        scopes: permissions ?? SIGNER_DEFAULT_SCOPES
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

      const notifyMissingPromptError = (): void => {
        notifyError({
          id: requestId ?? null,
          origin,
          error: {
            code: SignerErrorCode.PERMISSIONS_PROMPT_NOT_REGISTERED,
            message: 'The signer has not registered a prompt to respond to permission requests.'
          }
        });
      };

      if (isNullish(this.#permissionsPrompt)) {
        notifyMissingPromptError();

        return {handled: true};
      }

      // TODO: Can the newer version of TypeScript infer "as IcrcScope"?
      const supportedRequestedScopes = requestedScopes
        .filter(
          ({method: requestedMethod}) =>
            IcrcWalletScopedMethodSchema.safeParse(requestedMethod).success
        )
        .map(
          ({method}) =>
            ({
              scope: {method},
              state: IcrcWalletPermissionStateSchema.enum.denied
            }) as const as IcrcScope
        );

      // TODO: Maybe validating that the list of requested scopes contains at least one scope would be cool?
      // Additionally, it may be beneficial to define a type that ensures at least one scope is present when responding to permission queries ([IcrcScope, ...IcrcScop[]] in Zod).
      // Overall, it would be handy to enforce a minimum of one permission through types and behavior?

      class MissingPromptError extends Error {}

      const promise = new Promise<IcrcScopesArray>((resolve, reject) => {
        const confirmScopes: PermissionsConfirmation = (scopes) => {
          resolve(scopes);
        };

        // The consumer currently has no way to unregister the prompt, so we know that it is defined. However, to be future-proof, it's better to ensure it is defined.
        if (isNullish(this.#permissionsPrompt)) {
          reject(new MissingPromptError());
          return;
        }

        this.#permissionsPrompt({requestedScopes: supportedRequestedScopes, confirmScopes});
      });

      try {
        const confirmedScopes = await promise;

        this.confirmPermissions({scopes: confirmedScopes, requestId});

        return {handled: true};
      } catch (err: unknown) {
        if (err instanceof MissingPromptError) {
          notifyMissingPromptError();
          return {handled: true};
        }

        throw err;
      }
    }

    return {handled: false};
  }

  private confirmPermissions({scopes, requestId}: RequestPermissionPayload): void {
    assertNonNullish(this.#walletOrigin, "The relying party's origin is unknown.");

    notifyPermissionScopes({
      id: requestId,
      origin: this.#walletOrigin,
      scopes
    });

    savePermissions({owner: this.#owner, origin: this.#walletOrigin, scopes});
  }
}
