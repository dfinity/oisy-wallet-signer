import type {
  IcrcWalletPermissionsRequestType,
  IcrcWalletRequestPermissionsRequestType,
  IcrcWalletSupportedStandardsRequestType
} from './types/icrc-requests';

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

  static connect(parameters: SignerParameters): Signer {
    const signer = new Signer(parameters);
    return signer;
  }

  disconnect = (): void => {
    window.removeEventListener('message', this.onMessageListener);
  };

  private readonly onMessageListener = (message: SignerMessageEvent): void => {
    void this.onMessage(message);
  };

  private readonly onMessage = async (_message: SignerMessageEvent): Promise<void> => {};
}
