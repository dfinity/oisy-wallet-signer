import {TransferParams, toTransferArg} from '@dfinity/ledger-icrc';
import {TransferArgs} from './constants/icrc.idl.constants';
import type {
  IcrcAccount,
  IcrcCallCanisterResult,
  Origin,
  PrincipalText,
  RelyingPartyOptions
} from './index';
import {RelyingParty} from './relying-party';
import {encodeArg} from './utils/call.utils';

export class IcrcWallet extends RelyingParty {
  /**
   * Establishes a connection with an ICRC Wallet.
   *
   * @override
   * @static
   * @param {RelyingPartyOptions} options - The options to initialize the ICRC Wallet signer.
   * @returns {Promise<IcrcWallet>} A promise that resolves to an object, which can be used to interact with the ICRC Wallet when it is connected.
   */
  static async connect(options: RelyingPartyOptions): Promise<IcrcWallet> {
    return await this.connectSigner({
      options,
      init: (params: {origin: Origin; popup: Window}) => new IcrcWallet(params)
    });
  }

  transfer = async ({
    params,
    owner,
    ledgerCanisterId: canisterId
  }: {params: TransferParams; ledgerCanisterId: PrincipalText} & Pick<
    IcrcAccount,
    'owner'
  >): Promise<IcrcCallCanisterResult> => {
    const rawArgs = toTransferArg(params);

    const arg = encodeArg({
      recordClass: TransferArgs,
      rawArgs
    });

    return await this.call({
      params: {
        sender: owner,
        method: 'icrc1_transfer',
        canisterId,
        arg
      }
    });
  };
}
