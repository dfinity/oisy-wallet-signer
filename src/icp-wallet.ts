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
import type {RelyingPartyOptions} from './types/relying-party-options';
import type {RelyingPartyRequestOptions} from './types/relying-party-requests';
import {decodeResponse} from './utils/call.utils';
import {encodeArg} from './utils/idl.utils';

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
  static async connect({onDisconnect, ...rest}: RelyingPartyOptions): Promise<IcpWallet> {
    return await this.connectSigner({
      options: rest,
      init: (params: {origin: Origin; popup: Window}) =>
        new IcpWallet({
          ...params,
          onDisconnect
        })
    });
  }

  // TODO: documentation
  // TODO: return BlockHeight?
  // TODO: zod but, we have to redeclare Icrc1TransferRequest
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
    const rawArgs = toIcrc1TransferRawRequest(request);

    const arg = encodeArg({
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
      resultRecordClass: TransferResult
    });

    if ('Err' in response) {
      throw mapIcrc1TransferError(response.Err);
    }

    return response.Ok;
  };
}
