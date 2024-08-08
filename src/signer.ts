import {nonNullish} from '@dfinity/utils';
import {SignerErrorCode} from './constants/signer.constants';
import {SignerEvents} from './events/signer.events';
import {
  handleStatusRequest,
  handleSupportedStandards,
  notifyError
} from './handlers/signer.handlers';
import {ICRC25_REQUEST_PERMISSIONS, IcrcWalletApproveMethod} from './types/icrc';
import {IcrcWalletScopesParams} from './types/icrc-requests';
import {RpcRequestSchema} from './types/rpc';
import type {SignerMessageEvent} from './types/signer';

/**
 * The parameters to initialize a signer.
 * @interface
 */
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface SignerParameters {}

export class Signer {
  #walletOrigin: string | undefined | null;

  #requestsPermissionsEvents: SignerEvents<IcrcWalletScopesParams> =
    new SignerEvents<IcrcWalletScopesParams>();

  private constructor(_parameters: SignerParameters) {
    window.addEventListener('message', this.onMessageListener);
  }

  /**
   * Creates a signer that listens and communicates with a relying party.
   *
   * @static
   * @param {SignerParameters} parameters - The parameters for the signer.
   * @returns {Signer} The connected signer.
   */
  static init(parameters: SignerParameters): Signer {
    const signer = new Signer(parameters);
    return signer;
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

    const {handled: statusRequestHandled} = handleStatusRequest(message);
    if (statusRequestHandled) {
      return;
    }

    const {handled: supportedStandardsRequestHandled} = handleSupportedStandards(message);
    if (supportedStandardsRequestHandled) {
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

  on = ({
    method,
    callback
  }: {
    method: IcrcWalletApproveMethod;
    callback: (data: IcrcWalletScopesParams) => void;
  }): (() => void) => {
    switch (method) {
      case ICRC25_REQUEST_PERMISSIONS:
        return this.#requestsPermissionsEvents.on({callback});
    }

    throw new Error('TODO events not supported');
  };
}
