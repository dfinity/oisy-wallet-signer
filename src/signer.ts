import {nonNullish} from '@dfinity/utils';
import {SignerErrorCode} from './constants/signer.constants';
import {
  handleStatusRequest,
  handleSupportedStandards,
  notifyError
} from './handlers/signer.handlers';
import type {
  IcrcWalletPermissionsRequest,
  IcrcWalletRequestPermissionsRequest,
  IcrcWalletStatusRequest,
  IcrcWalletSupportedStandardsRequest
} from './types/icrc-requests';
import {RpcRequestSchema} from './types/rpc';

/**
 * The parameters to initialize a signer.
 * @interface
 */
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface SignerParameters {}

export type SignerMessageEventData = Partial<
  | IcrcWalletStatusRequest
  | IcrcWalletRequestPermissionsRequest
  | IcrcWalletPermissionsRequest
  | IcrcWalletSupportedStandardsRequest
>;

type SignerMessageEvent = MessageEvent<SignerMessageEventData>;

export class Signer {
  #walletOrigin: string | undefined | null;

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

  private readonly onMessage = async ({
    data: msgData,
    origin
  }: SignerMessageEvent): Promise<void> => {
    const {success, data: requestData} = RpcRequestSchema.safeParse(msgData);

    if (!success) {
      // We are only interested in JSON-RPC messages, so we are ignoring any other messages emitted at the window level, as the consumer might be using other events.
      return;
    }

    this.assertAndSetOrigin({msgData, origin});

    const {handled: statusRequestHandled} = handleStatusRequest({origin, data: msgData});
    if (statusRequestHandled) {
      return;
    }

    const {handled: supportedStandardsRequestHandled} = handleSupportedStandards({
      origin,
      data: msgData
    });
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

  private assertAndSetOrigin({
    msgData,
    origin
  }: {
    origin: string;
    msgData: SignerMessageEventData;
  }): void {
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
}
