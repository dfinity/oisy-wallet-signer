import {arrayBufferToUint8Array, uint8ArrayToHexString} from '@dfinity/utils';
import {encode} from '../agent/agentjs-cbor-copy';
import type {CustomHttpAgentResponse} from '../agent/custom-http-agent';
import type {IcrcCallCanisterRequestParams} from '../types/icrc-requests';
import type {IcrcCallCanisterResult} from '../types/icrc-responses';
import type {SignerOptions} from '../types/signer-options';
import {uint8ArrayToBase64} from '../utils/base64.utils';
import {Icrc21Canister} from './icrc21-canister.api';
import {requestIdOf} from "@dfinity/agent";

export class SignerApi extends Icrc21Canister {
  async call({
    owner,
    host,
    params: {canisterId, method, arg}
  }: {
    params: IcrcCallCanisterRequestParams;
  } & SignerOptions): Promise<IcrcCallCanisterResult> {
    const agent = await this.getAgent({host, owner});

    const result = await agent.request({
      canisterId,
      method,
      arg
    });

    return this.encodeResult(result);
  }

  private encodeResult({
    requestDetails: contentMap,
    certificate
  }: CustomHttpAgentResponse): IcrcCallCanisterResult {
    const encodedCertificate = uint8ArrayToBase64(
      arrayBufferToUint8Array(encode(certificate.cert))
    );

    const requestId = requestIdOf(contentMap!);

    console.log('requestId again:', uint8ArrayToHexString(arrayBufferToUint8Array(requestId)));

    const encodedContentMap = uint8ArrayToBase64(arrayBufferToUint8Array(encode(contentMap)));

    console.log('encodedContentMap:', encodedContentMap);

    return {
      certificate: encodedCertificate,
      contentMap: encodedContentMap
    };
  }
}
