import {nonNullish} from '@dfinity/utils';
import {SignerErrorCode} from './constants/signer.constants';
import {notifyError, notifyReady} from './handlers/signer.handlers';
import {
  IcrcWalletStatusRequest,
  type IcrcWalletPermissionsRequestType,
  type IcrcWalletRequestPermissionsRequestType,
  type IcrcWalletSupportedStandardsRequestType
} from './types/icrc-requests';
import {RpcRequest} from './types/rpc';

/**
 * The parameters to initialize a signer.
 * @interface
 */
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface SignerParameters {}

export type SignerMessageEventData = Partial<
  | IcrcWalletRequestPermissionsRequestType
  | IcrcWalletPermissionsRequestType
  | IcrcWalletSupportedStandardsRequestType
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
    const {success} = RpcRequest.safeParse(msgData);

    if (!success) {
      // We are only interested in JSON-RPC messages, so we are ignoring any other messages emitted at the window level, as the consumer might be using other events.
      return;
    }

    // TODO: assert messages to notify error if methods are not supported.

    this.assertAndSetOrigin({msgData, origin});

    const {success: isStatusRequest, data} = IcrcWalletStatusRequest.safeParse(msgData);

    if (isStatusRequest) {
      const {id} = data;
      notifyReady({id, origin});
    }
  };

  private assertAndSetOrigin({
    msgData,
    origin
  }: {
    origin: string;
    msgData: SignerMessageEventData;
  }): void {
    if (nonNullish(this.#walletOrigin) && this.#walletOrigin !== origin) {
      const {data} = RpcRequest.safeParse(msgData);

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
