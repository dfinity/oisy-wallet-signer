import {encode, encodeWithSelfDescribedTag} from '@dfinity/cbor';
import {type IcrcTokenMetadataResponse, IcrcLedgerCanister} from '@dfinity/ledger-icrc';
import {uint8ArrayToBase64} from '@dfinity/utils';
import {Principal} from '@icp-sdk/core/principal';
import type {CustomHttpAgentResponse} from '../agent/custom-http-agent';
import type {IcrcCallCanisterRequestParams} from '../types/icrc-requests';
import type {IcrcCallCanisterResult} from '../types/icrc-responses';
import type {SignerOptions} from '../types/signer-options';
import {contentMapReplacer} from '../utils/cbor.utils';
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
    const encodedCertificate = uint8ArrayToBase64(encodeWithSelfDescribedTag(certificate.cert));

    const encodedContentMap = uint8ArrayToBase64(encode(contentMap, contentMapReplacer));

    return {
      certificate: encodedCertificate,
      contentMap: encodedContentMap
    };
  }
}
