import {
  AnonymousIdentity,
  Certificate,
  Expiry,
  HttpAgent,
  lookupResultToBuffer,
  requestIdOf
} from '@dfinity/agent';
import type {CallRequest} from '@dfinity/agent/lib/cjs/agent/http/types';
import {IDL} from '@dfinity/candid';
import {
  BlockHeight,
  mapIcrc1TransferError,
  toIcrc1TransferRawRequest,
  type Icrc1TransferRequest
} from '@dfinity/ledger-icp';
import {Principal} from '@dfinity/principal';
import {arrayBufferToUint8Array, assertNonNullish} from '@dfinity/utils';
import type {BigNumber} from 'bignumber.js';
import {decode} from './agent/agentjs-cbor-copy';
import {TransferArgs, TransferError} from './constants/icrc.idl.constants';
import {RelyingParty} from './relying-party';
import type {IcrcAccount} from './types/icrc-accounts';
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
  } & Pick<IcrcAccount, 'owner'>): Promise<BlockHeight> => {
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

    // TODO: The decode function copied from agent-js is buggy or does not support decoding the ingress_expiry to BigInt or Expiry. It seems that the value is a BigNumber. That's why we have to strip it from the response and convert it manually.
    const {
      ingress_expiry,
      ...callRequestTmp
    }: Omit<CallRequest, 'ingress_expiry'> & {ingress_expiry: BigNumber} = decode(
      base64ToUint8Array(contentMap)
    );

    const callRequest: CallRequest = {
      ...callRequestTmp,
      // There is no constructor or setter to create an agent-js Expiry from a bigint. Type which is expected by CallRequest. Given that we solely require the wrapped BigInt in this function, we can resolve the issue with an ugly cast.
      ingress_expiry: BigInt(ingress_expiry.toFixed()) as unknown as Expiry
    } as CallRequest;

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

    const certificate = await Certificate.create({
      certificate: base64ToUint8Array(cert),
      rootKey: agent.rootKey,
      canisterId: Principal.fromText(canisterId)
    });

    const path = [new TextEncoder().encode('request_status'), requestId];

    const reply = lookupResultToBuffer(certificate.lookup([...path, 'reply']));

    assertNonNullish(
      reply,
      'A reply cannot be resolved within the provided certificate. This is unexpected; it should have been known at this point.'
    );

    const response: [Icrc1TransferRequest] = IDL.decode([IDL.Variant({Ok: IDL.Nat, Err: TransferError})], reply);

    console.log(response);

    if ('Err' in response) {
      throw mapIcrc1TransferError(response.Err);
    }

    return response.Ok;
  };
}
