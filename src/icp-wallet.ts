import {
  BlockHeight,
  mapIcrc1TransferError,
  toIcrc1TransferRawRequest,
  type Icrc1TransferRequest
} from '@dfinity/ledger-icp';
import {Icrc1TransferResult} from '@dfinity/ledger-icp/dist/candid/ledger';
import {TransferArgs, TransferResult} from './constants/icrc.idl.constants';
import {RelyingParty} from './relying-party';
import type {IcrcAccount} from './types/icrc-accounts';
import type {IcrcCallCanisterRequestParams} from './types/icrc-requests';
import type {Origin} from './types/post-message';
import type {PrincipalText} from './types/principal';
import {RelyingPartyOptions} from './types/relying-party-options';
import type {RelyingPartyRequestOptions} from './types/relying-party-requests';
import {decodeResponse} from './utils/call.utils';
import {encodeIdl} from './utils/idl.utils';

const ICP_LEDGER_CANISTER_ID = 'ryjl3-tyaaa-aaaaa-aaaba-cai';

export class IcpWallet extends RelyingParty {
  /**
   * Establishes a connection with an ICP Wallet.
   *
   * @override
   * @static
   * @param {RelyingPartyOptions} options - The options to initialize the ICP Wallet signer.
   * @returns {Promise<IcpWallet>} A promise that resolves to an object, which can be used to interact with the ICP Wallet when it is connected.
   */
  static async connect({onDisconnect, host, ...rest}: RelyingPartyOptions): Promise<IcpWallet> {
    return await this.connectSigner({
      options: rest,
      init: (params: {origin: Origin; popup: Window}) =>
        new IcpWallet({
          ...params,
          onDisconnect,
          host
        })
    });
  }

  /**
   * Transfer ICP to the destination Account. Returns the index of the block containing the tx if it was successful.
   *
   * @param {Object} params - The transfer parameters.
   * @param {Icrc1TransferRequest} params.request - The request object containing transfer details.
   * @param {string} params.owner - The owner of the wallet
   * @param {PrincipalText} [params.ledgerCanisterId] - Optional ledger canister ID, if not provided, uses the default ICP ledger canister ID.
   * @param {RelyingPartyRequestOptions} [params.options] - Optional parameters for the request, such as request ID, authorization, or timeout.
   *
   * @returns {Promise<BlockHeight>} The block height of the transfer transaction if successful.
   */
  public icrc1Transfer = async ({
    request,
    owner,
    ledgerCanisterId,
    options
  }: {
    options?: RelyingPartyRequestOptions;
    request: Icrc1TransferRequest;
    ledgerCanisterId?: PrincipalText;
  } & Pick<IcrcAccount, 'owner'>): Promise<BlockHeight> => {
    // TODO: should we convert ic-js to zod? or should we map Icrc1TransferRequest to zod?
    const rawArgs = toIcrc1TransferRawRequest(request);

    const arg = encodeIdl({
      recordClass: TransferArgs,
      rawArgs
    });

    const canisterId = ledgerCanisterId ?? ICP_LEDGER_CANISTER_ID;

    const method = 'icrc1_transfer' as const;

    const callParams: IcrcCallCanisterRequestParams = {
      sender: owner,
      method,
      canisterId,
      arg
    };

    // TODO: uncomment nonce and add TODO - not yet supported by agent-js

    const callResult = await this.call({
      params: callParams,
      options
    });

    const response = await decodeResponse<Icrc1TransferResult>({
      params: callParams,
      result: callResult,
      resultRecordClass: TransferResult,
      host: this.host
    });

    if ('Err' in response) {
      throw mapIcrc1TransferError(response.Err);
    }

    return response.Ok;
  };
}
