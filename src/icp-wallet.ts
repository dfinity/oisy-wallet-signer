import {
  AnonymousIdentity,
  Certificate,
  HttpAgent,
  lookupResultToBuffer,
  requestIdOf
} from '@dfinity/agent';
import type {CallRequest} from '@dfinity/agent/lib/cjs/agent/http/types';
import {toIcrc1TransferRawRequest, type Icrc1TransferRequest} from '@dfinity/ledger-icp';
import {Principal} from '@dfinity/principal';
import {arrayBufferToUint8Array} from '@dfinity/utils';
import {decode} from './agent/agentjs-cbor-copy';
import {TransferArgs} from './constants/icrc.idl.constants';
import {RelyingParty} from './relying-party';
import type {IcrcAccount} from './types/icrc-accounts';
import type {IcrcCallCanisterResult} from './types/icrc-responses';
import type {Origin} from './types/post-message';
import type {PrincipalText} from './types/principal';
import type {RelyingPartyOptions} from './types/relying-party-options';
import {base64ToUint8Array} from './utils/base64.utils';
import {encodeArg} from './utils/call.utils';

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
  } & Pick<IcrcAccount, 'owner'>): Promise<IcrcCallCanisterResult> => {
    const rawArgs = toIcrc1TransferRawRequest(request);

    const arg = encodeArg({
      recordClass: TransferArgs,
      rawArgs
    });

    const canisterId = ledgerCanisterId ?? ICP_LEDGER_CANISTER_ID;

    // TODO: uncomment nonce and add TODO - not yet supported by agent-js

    const {certificate: cert, contentMap} = await this.call({
      params: {
        sender: owner,
        method: 'icrc1_transfer',
        canisterId,
        arg
      }
    });

    const callRequest: CallRequest = decode(base64ToUint8Array(contentMap));
    const requestId = requestIdOf(callRequest);

    if (callRequest.method_name !== 'icrc1_transfer') {
      throw new Error('The response method does not match the request method.');
    }

    // TODO: improve performance by modifying encodeArg to return this information
    const requestArg = base64ToUint8Array(arg);

    const uint8ArrayEqual = ({first, second}: {first: Uint8Array; second: Uint8Array}): boolean =>
      first.length === second.length && first.every((value, index) => value === second[index]);

    if (!uint8ArrayEqual({first: requestArg, second: arrayBufferToUint8Array(callRequest.arg)})) {
      throw new Error('The response does not contain the request arguments.');
    }

    // We have to create an agent to retrieve the rootKey, which is both inefficient and ugly.
    // TODO: we do not have the identity
    // TODO: we do not have the host here neither
    const agent = await HttpAgent.create({
      identity: new AnonymousIdentity(),
      host: 'http://localhost:4943',
      shouldFetchRootKey: true
    });

    console.log(canisterId, requestId);

    const certificate = await Certificate.create({
      certificate: base64ToUint8Array(cert),
      rootKey: agent.rootKey,
      canisterId: Principal.fromText(canisterId)
    });

    const path = [new TextEncoder().encode('request_status'), requestId];

    const _status = new TextDecoder().decode(
      lookupResultToBuffer(certificate.lookup([...path, 'status']))
    );

    const reply = lookupResultToBuffer(certificate.lookup([...path, 'reply']));

    // TODO: reply is undefined
    console.log(reply, reply === undefined); // true

    // TODO: decode reply with Candid

    return {certificate: cert, contentMap};
  };
}
