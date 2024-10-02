import {
  AnonymousIdentity,
  Certificate,
  HttpAgent,
  lookupResultToBuffer,
  requestIdOf
} from '@dfinity/agent';
import {
  BlockHeight,
  mapIcrc1TransferError,
  toIcrc1TransferRawRequest,
  type Icrc1TransferRequest
} from '@dfinity/ledger-icp';
import {Icrc1TransferResult} from '@dfinity/ledger-icp/dist/candid/ledger';
import {Principal} from '@dfinity/principal';
import {assertNonNullish} from '@dfinity/utils';
import {TransferArgs, TransferResult} from './constants/icrc.idl.constants';
import {RelyingParty} from './relying-party';
import type {IcrcAccount} from './types/icrc-accounts';
import type {Origin} from './types/post-message';
import type {PrincipalText} from './types/principal';
import type {RelyingPartyOptions} from './types/relying-party-options';
import {decodeCallRequest} from './utils/agentjs-cbor-copy.utils';
import {base64ToUint8Array} from './utils/base64.utils';
import {assertCallArg, assertCallMethod} from './utils/call.utils';
import {decodeResult, encodeArg} from './utils/idl.utils';

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
  static async connect(options: RelyingPartyOptions): Promise<IcpWallet> {
    return await this.connectSigner({
      options,
      init: (params: {origin: Origin; popup: Window}) => new IcpWallet(params)
    });
  }

  // TODO: documentation
  // TODO: return BlockHeight?
  // TODO: zod but, we have to redeclare Icrc1TransferRequest
  public icrc1Transfer = async ({
    request,
    owner,
    ledgerCanisterId
  }: {
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

    // TODO: uncomment nonce and add TODO - not yet supported by agent-js

    const {certificate: cert, contentMap} = await this.call({
      params: {
        sender: owner,
        method,
        canisterId,
        arg
      }
    });

    const callRequest = decodeCallRequest(contentMap);

    assertCallMethod({
      requestMethod: method,
      responseMethod: callRequest.method_name
    });

    assertCallArg({
      requestArg: arg,
      responseArg: callRequest.arg
    });

    // We have to create an agent to retrieve the rootKey, which is both inefficient and ugly.
    // TODO: we do not have the identity
    // TODO: we do not have the host here neither
    const agent = await HttpAgent.create({
      identity: new AnonymousIdentity(),
      host: 'http://localhost:4943',
      shouldFetchRootKey: true
    });

    const certificate = await Certificate.create({
      certificate: base64ToUint8Array(cert),
      rootKey: agent.rootKey,
      canisterId: Principal.fromText(canisterId)
    });

    const requestId = requestIdOf(callRequest);

    const path = [new TextEncoder().encode('request_status'), requestId];

    const reply = lookupResultToBuffer(certificate.lookup([...path, 'reply']));

    assertNonNullish(
      reply,
      'A reply cannot be resolved within the provided certificate. This is unexpected; it should have been known at this point.'
    );

    const response = decodeResult<Icrc1TransferResult>({
      recordClass: TransferResult,
      reply
    });

    if ('Err' in response) {
      throw mapIcrc1TransferError(response.Err);
    }

    return response.Ok;
  };
}
