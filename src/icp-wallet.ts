import {RelyingParty} from './relying-party';
import type {RelyingPartyOptions} from './types/relying-party-options';

export class IcpWallet extends RelyingParty {
  /**
   * Establishes a connection with an ICP Wallet.
   *
   * @override
   * @static
   * @param {RelyingPartyOptions} options - The options to initialize the ICP Wallet signer.
   * @returns {Promise<IcpWallet>} A promise that resolves to an object, which can be used to interact with the ICP Wallet when it is connected.
   */
  static async connect(options: RelyingPartyOptions): Promise<IcpWallet> {
    return await this.connectWallet({
      options,
      init: (params: {origin: string; popup: Window}) => new IcpWallet(params)
    });
  }
}
