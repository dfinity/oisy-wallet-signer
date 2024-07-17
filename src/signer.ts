import {
  IcrcWalletPermissionsRequestType,
  IcrcWalletRequestPermissionsRequestType,
  IcrcWalletSupportedStandardsRequestType
} from './types/icrc-requests';

interface SignerParameters {}

export class Signer {
  #walletOrigin: string | undefined;

  private constructor({}: SignerParameters) {
    window.addEventListener('message', this.onMessage);
  }

  static connect(parameters: SignerParameters): Signer {
    const signer = new Signer(parameters);
    return signer;
  }

  disconnect = () => {
    window.removeEventListener('message', this.onMessage);
  };

  private onMessage = async ({
    data,
    origin
  }: MessageEvent<
    Partial<
      | IcrcWalletRequestPermissionsRequestType
      | IcrcWalletPermissionsRequestType
      | IcrcWalletSupportedStandardsRequestType
    >
  >) => {};
}
