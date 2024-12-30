import {
  IcrcBlockIndex,
  IcrcTransferError,
  IcrcTransferVariatError,
  TransferParams,
  toTransferArg
} from '@dfinity/ledger-icrc';
import {TransferArgs, TransferResult} from './constants/icrc-1.idl.constants';
import type {
  IcrcAccount,
  IcrcCallCanisterRequestParams,
  Origin,
  PrincipalText,
  RelyingPartyOptions,
  RelyingPartyRequestOptions
} from './index';
import {RelyingParty} from './relying-party';
import {decodeResponse} from './utils/call.utils';
import {encodeIdl} from './utils/idl.utils';

export class IcrcWallet extends RelyingParty {
  /**
   * Establishes a connection with an ICRC Wallet.
   *
   * @override
   * @static
   * @param {RelyingPartyOptions} options - The options to initialize the ICRC Wallet signer.
   * @returns {Promise<IcrcWallet>} A promise that resolves to an object, which can be used to interact with the ICRC Wallet when it is connected.
   */
  static async connect({onDisconnect, host, ...rest}: RelyingPartyOptions): Promise<IcrcWallet> {
    return await this.connectSigner({
      options: rest,
      init: (params: {origin: Origin; popup: Window}) =>
        new IcrcWallet({
          ...params,
          onDisconnect,
          host
        })
    });
  }

  /**
   * Transfer Icrc tokens to the destination Account. Returns the index of the block containing the tx if it was successful.
   *
   * @param {Object} params - The transfer parameters.
   * @param {TransferParams} params.params - The object containing transfer details, such as amount and destination.
   * @param {string} params.owner - The owner of the wallet.
   * @param {PrincipalText} [params.ledgerCanisterId] - Optional ledger canister ID, defaults to the Icrc ledger if not provided.
   * @param {RelyingPartyRequestOptions} [params.options] - Optional parameters for the request, such as request ID, authorization, or timeout.
   *
   * @returns {Promise<IcrcBlockIndex>} A promise that resolves to the block index of the transfer transaction if successful.
   */
  transfer = async ({
    params,
    owner,
    ledgerCanisterId: canisterId,
    options
  }: {
    params: TransferParams;
    ledgerCanisterId: PrincipalText;
    options?: RelyingPartyRequestOptions;
  } & Pick<IcrcAccount, 'owner'>): Promise<IcrcBlockIndex> => {
    const rawArgs = toTransferArg(params);

    const arg = encodeIdl({
      recordClass: TransferArgs,
      rawArgs
    });

    const callParams: IcrcCallCanisterRequestParams = {
      sender: owner,
      method: 'icrc1_transfer',
      canisterId,
      arg
    };

    const callResult = await this.call({
      params: callParams,
      options
    });

    type TransferResult = {Ok: IcrcBlockIndex} | {Err: IcrcTransferVariatError};

    const response = await decodeResponse<TransferResult>({
      params: callParams,
      result: callResult,
      resultRecordClass: TransferResult,
      host: this.host
    });

    if ('Err' in response) {
      throw new IcrcTransferError({
        errorType: response.Err,
        msg: 'Failed to transfer'
      });
    }

    return response.Ok;
  };
}
