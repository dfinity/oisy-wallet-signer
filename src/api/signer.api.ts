import {IcrcLedgerCanister} from '@dfinity/ledger-icrc';
import type {IcrcTokenMetadataResponse} from '@dfinity/ledger-icrc/dist/types/types/ledger.responses';
import {Principal} from '@dfinity/principal';
import {arrayBufferToUint8Array, uint8ArrayToBase64} from '@dfinity/utils';
import {encode} from '../agent/agentjs-cbor-copy';
import type {CustomHttpAgentResponse} from '../agent/custom-http-agent';
import type {IcrcCallCanisterRequestParams} from '../types/icrc-requests';
import type {IcrcCallCanisterResult} from '../types/icrc-responses';
import type {SignerOptions} from '../types/signer-options';
import {Icrc21Canister} from './icrc21-canister.api';

export class SignerApi extends Icrc21Canister {
  async call({
    owner,
    host,
    params: {canisterId, method, arg, nonce}
  }: {
    params: IcrcCallCanisterRequestParams;
  } & SignerOptions): Promise<IcrcCallCanisterResult> {
    const agent = await this.getCustomAgent({host, owner});

    const result = await agent.request({
      canisterId,
      method,
      arg,
      nonce
    });

    return this.encodeResult(result);
  }

  async ledgerMetadata({
    host,
    owner,
    params: {canisterId}
  }: {
    params: Pick<IcrcCallCanisterRequestParams, 'canisterId'>;
  } & SignerOptions): Promise<IcrcTokenMetadataResponse> {
    const {agent} = await this.getDefaultAgent({host, owner});

    // TODO: improve performance by caching the IcrcLedgerCanister?
    const {metadata} = IcrcLedgerCanister.create({
      agent,
      canisterId: Principal.fromText(canisterId)
    });

    return await metadata({certified: true});
  }

  private encodeResult({
    requestDetails: contentMap,
    certificate
  }: CustomHttpAgentResponse): IcrcCallCanisterResult {
    const encodedCertificate = uint8ArrayToBase64(
      arrayBufferToUint8Array(encode(certificate.cert))
    );

    const encodedContentMap = uint8ArrayToBase64(arrayBufferToUint8Array(encode(contentMap)));

    return {
      certificate: encodedCertificate,
      contentMap: encodedContentMap
    };
  }
}
