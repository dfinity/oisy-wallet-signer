import {nonNullish} from '@dfinity/utils';
import {notifyReady} from './handlers/signer.handlers';
import {
  IcrcWalletStatusRequest,
  type IcrcWalletPermissionsRequestType,
  type IcrcWalletRequestPermissionsRequestType,
  type IcrcWalletSupportedStandardsRequestType
} from './types/icrc-requests';

/**
 * The parameters to initialize a signer.
 * @interface
 */
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface SignerParameters {}

type SignerMessageEvent = MessageEvent<
  Partial<
    | IcrcWalletRequestPermissionsRequestType
    | IcrcWalletPermissionsRequestType
    | IcrcWalletSupportedStandardsRequestType
  >
>;

export class Signer {
  #walletOrigin: string | undefined;

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
  };

  private readonly onMessageListener = (message: SignerMessageEvent): void => {
    void this.onMessage(message);
  };

  private readonly onMessage = async ({
    data: msgData,
    origin
  }: SignerMessageEvent): Promise<void> => {
    this.assertAndSetOrigin(origin);

    const {success: isStatusRequest, data} = IcrcWalletStatusRequest.safeParse(msgData);

    if (isStatusRequest) {
      const {id} = data;
      notifyReady({id});
    }
  };

  private assertAndSetOrigin(origin: string): void {
    if (nonNullish(this.#walletOrigin) && this.#walletOrigin !== origin) {
      throw new Error('Origin is not allowed to interact with the signer');
    }

    if (nonNullish(this.#walletOrigin)) {
      return;
    }

    this.#walletOrigin = origin;
  }
}
