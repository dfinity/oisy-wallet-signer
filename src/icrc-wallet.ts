import {
  ApproveParams,
  IcrcBlockIndex,
  IcrcTransferError,
  TransferFromParams,
  TransferParams,
  toApproveArgs,
  toTransferArg,
  toTransferFromArgs
} from '@dfinity/ledger-icrc';
import type {
  ApproveError,
  TransferError,
  TransferFromError
} from '@dfinity/ledger-icrc/dist/candid/icrc_ledger';
import {TransferArgs, TransferResult} from './constants/icrc-1.idl.constants';
import {
  ApproveArgs,
  ApproveResult,
  TransferFromArgs,
  TransferFromResult
} from './constants/icrc-2.idl.constants';
import {RelyingParty} from './relying-party';
import {IcrcAccount} from './types/icrc-accounts';
import {IcrcCallCanisterRequestParams} from './types/icrc-requests';
import {Origin} from './types/post-message';
import {PrincipalText} from './types/principal';
import {RelyingPartyOptions} from './types/relying-party-options';
import {RelyingPartyRequestOptions} from './types/relying-party-requests';
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
   * @param {PrincipalText} [params.ledgerCanisterId] - The ledger canister ID.
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

    type TransferResult = {Ok: IcrcBlockIndex} | {Err: TransferError};

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

  /**
   * Approves a spender to transfer a specified amount of ICRC tokens from the owner's account.
   *
   * @param {Object} params - The approve parameters.
   * @param {ApproveParams} params.params - The details of the approval, including the spender's account and amount.
   * @param {string} params.owner - The owner of the wallet authorizing the spender.
   * @param {PrincipalText} [params.ledgerCanisterId] - The ledger canister ID.
   * @param {RelyingPartyRequestOptions} [params.options] - Optional parameters for the request, such as request ID, authorization, or timeout.
   *
   * @throws {IcrcTransferError} Throws an error if the approval fails.
   *
   * @returns {Promise<IcrcBlockIndex>} A promise that resolves to the block index of the approval transaction if successful.
   */
  approve = async ({
    params,
    owner,
    ledgerCanisterId: canisterId,
    options
  }: {
    params: ApproveParams;
    ledgerCanisterId: PrincipalText;
    options?: RelyingPartyRequestOptions;
  } & Pick<IcrcAccount, 'owner'>): Promise<IcrcBlockIndex> => {
    const rawArgs = toApproveArgs(params);

    const arg = encodeIdl({
      recordClass: ApproveArgs,
      rawArgs
    });

    const callParams: IcrcCallCanisterRequestParams = {
      sender: owner,
      method: 'icrc2_approve',
      canisterId,
      arg
    };

    const callResult = await this.call({
      params: callParams,
      options
    });

    type ApproveResult = {Ok: IcrcBlockIndex} | {Err: ApproveError};

    const response = await decodeResponse<ApproveResult>({
      params: callParams,
      result: callResult,
      resultRecordClass: ApproveResult,
      host: this.host
    });

    if ('Err' in response) {
      throw new IcrcTransferError({
        errorType: response.Err,
        msg: 'Failed to entitle the spender to transfer the amount'
      });
    }

    return response.Ok;
  };

  /**
   * Transfers ICRC tokens from one account to another using an approved allowance.
   *
   * @param {Object} params - The transfer-from parameters.
   * @param {TransferFromParams} params.params - The details of the transfer, including the source, destination, and amount.
   * @param {string} params.owner - The owner of the wallet initiating the transfer.
   * @param {PrincipalText} [params.ledgerCanisterId] - Optional ledger canister ID, defaults to the ICRC ledger if not provided.
   * @param {RelyingPartyRequestOptions} [params.options] - Optional parameters for the request, such as request ID, authorization, or timeout.
   *
   * @throws {IcrcTransferError} Throws an error if the transfer fails.
   *
   * @returns {Promise<IcrcBlockIndex>} A promise that resolves to the block index of the transfer transaction if successful.
   */
  transferFrom = async ({
    params,
    owner,
    ledgerCanisterId: canisterId,
    options
  }: {
    params: TransferFromParams;
    ledgerCanisterId: PrincipalText;
    options?: RelyingPartyRequestOptions;
  } & Pick<IcrcAccount, 'owner'>): Promise<IcrcBlockIndex> => {
    const rawArgs = toTransferFromArgs(params);

    const arg = encodeIdl({
      recordClass: TransferFromArgs,
      rawArgs
    });

    const callParams: IcrcCallCanisterRequestParams = {
      sender: owner,
      method: 'icrc2_transfer_from',
      canisterId,
      arg
    };

    const callResult = await this.call({
      params: callParams,
      options
    });

    type TransferFromResult = {Ok: IcrcBlockIndex} | {Err: TransferFromError};

    const response = await decodeResponse<TransferFromResult>({
      params: callParams,
      result: callResult,
      resultRecordClass: TransferFromResult,
      host: this.host
    });

    if ('Err' in response) {
      throw new IcrcTransferError({
        errorType: response.Err,
        msg: 'Failed to transfer from'
      });
    }

    return response.Ok;
  };
}
