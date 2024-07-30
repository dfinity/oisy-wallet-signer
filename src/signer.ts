import type {
  IcrcWalletPermissionsRequestType,
  IcrcWalletRequestPermissionsRequestType,
  IcrcWalletSupportedStandardsRequestType
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
  readonly #walletOrigin: string | undefined;

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

  private readonly onMessage = async (_message: SignerMessageEvent): Promise<void> => {};
}
