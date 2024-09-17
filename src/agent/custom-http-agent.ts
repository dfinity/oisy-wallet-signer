import type {CallRequest, HttpAgentOptions} from '@dfinity/agent';
import {
  Certificate,
  defaultStrategy,
  HttpAgent,
  lookupResultToBuffer,
  pollForResponse as pollForResponseAgent,
  SubmitResponse
} from '@dfinity/agent';
import {bufFromBufLike} from '@dfinity/candid';
import {Principal} from '@dfinity/principal';
import {arrayBufferToUint8Array, isNullish, nonNullish} from '@dfinity/utils';
import {IcrcCallCanisterRequestParams} from '../types/icrc-requests';
import {IcrcCallCanisterResult} from '../types/icrc-responses';
import {base64ToUint8Array, uint8ArrayToBase64} from '../utils/base64.utils';
import {encode} from './agentjs-cbor-copy';

// To extend the HttpAgent, we would have to override the static create function.
// While this is possible, it would require using Object.assign to clone the HttpAgent into a CustomHttpAgent, because the super function does not accept generics.
// Therefore, it is cleaner in my opinion to encapsulate the agent rather than extend it.
export class CustomHttpAgent {
  #agent: HttpAgent;

  private constructor(agent: HttpAgent) {
    this.#agent = agent;
  }

  static async create(
    options?: HttpAgentOptions & {
      shouldFetchRootKey?: boolean;
    }
  ): Promise<CustomHttpAgent> {
    const agent = await HttpAgent.create(options);
    return new CustomHttpAgent(agent);
  }

  request = async ({
    arg,
    canisterId,
    method: methodName
  }: Pick<
    IcrcCallCanisterRequestParams,
    'canisterId' | 'method' | 'arg'
  >): Promise<IcrcCallCanisterResult> => {
    const {requestDetails, ...restResponse} = await this.#agent.call(canisterId, {
      methodName,
      arg: base64ToUint8Array(arg),
      // effectiveCanisterId is optional but, actually mandatory according SDK team.
      effectiveCanisterId: canisterId
    });

    this.assertRequestDetails(requestDetails);

    if (isNullish(requestDetails)) {
      // TODO proper error
      throw new Error('Empty content map');
    }

    const result = await this.readResponse({
      callResponse: {requestDetails, ...restResponse},
      canisterId
    });

    // I assume that if we get a result at this point, it means we can respond to the caller.
    // However, this is not how it's handled in Agent-js. For some reason, regardless of whether they get a result at this point or not, if the response has a status of 202, they overwrite the result with pollForResponse, which seems incorrect.
    // That is why we return the result if we get one.
    if (nonNullish(result)) {
      return result;
    }

    const {
      response: {status}
    } = restResponse;

    // Fall back to polling if we receive an Accepted response code
    if (status === 202) {
      return await this.pollForResponse({
        callResponse: {requestDetails, ...restResponse},
        canisterId
      });
    }

    // TODO: error
    throw new Error();
  };

  private async readResponse({
    callResponse: {
      requestId,
      response: {body},
      requestDetails
    },
    canisterId
  }: {callResponse: Required<SubmitResponse>} & Pick<
    IcrcCallCanisterRequestParams,
    'canisterId'
  >): Promise<IcrcCallCanisterResult | undefined> {
    // Certificate is only support in v3.
    if (isNullish(body) || isNullish(body.certificate)) {
      return undefined;
    }

    // I'm not sure why we don't check the response status, 202, before trying to search for a certificate. This seems inaccurate, but that's how Agent-js handles it.

    const {certificate: cert} = body;

    const certificate = await Certificate.create({
      certificate: bufFromBufLike(cert),
      rootKey: this.#agent.rootKey,
      canisterId: Principal.fromText(canisterId)
    });

    const {result: replyCheck} = this.assertReply({
      certificate,
      requestId
    });

    if (replyCheck !== 'valid') {
      // TODO: error
      throw new Error();
    }

    return this.encodeResult({certificate, requestDetails});
  }

  private assertRequestDetails(
    requestDetails?: CallRequest
  ): requestDetails is NonNullable<CallRequest> {
    return nonNullish(requestDetails);
  }

  private assertReply({
    certificate,
    requestId
  }: {certificate: Certificate} & Pick<SubmitResponse, 'requestId'>): {
    result: 'valid' | 'invalid' | 'rejected' | 'empty';
  } {
    const path = [new TextEncoder().encode('request_status'), requestId];

    const status = new TextDecoder().decode(
      lookupResultToBuffer(certificate.lookup([...path, 'status']))
    );

    switch (status) {
      case 'replied':
        const reply = lookupResultToBuffer(certificate.lookup([...path, 'reply']));
        return {result: nonNullish(reply) ? 'valid' : 'invalid'};
      case 'rejected':
        throw {result: 'rejected'};
      default:
        // I'm not sure why undefined would be an acceptable result for this default implementation, but that's what Agent-js does.
        // However, we consider it as not expected and we will throw an error if we get this.
        return {result: 'empty'};
    }
  }

  private async pollForResponse({
    callResponse: {requestId, requestDetails},
    canisterId
  }: {callResponse: Pick<Required<SubmitResponse>, 'requestId' | 'requestDetails'>} & Pick<
    IcrcCallCanisterRequestParams,
    'canisterId'
  >): Promise<IcrcCallCanisterResult> {
    const {certificate} = await pollForResponseAgent(
      this.#agent,
      Principal.fromText(canisterId),
      requestId,
      defaultStrategy()
    );

    return this.encodeResult({certificate, requestDetails});
  }

  private encodeResult({
    requestDetails: contentMap,
    certificate
  }: Pick<Required<SubmitResponse>, 'requestDetails'> & {
    certificate: Certificate;
  }): IcrcCallCanisterResult {
    const encodedCertificate = uint8ArrayToBase64(arrayBufferToUint8Array(encode(certificate)));
    const encodedContentMap = uint8ArrayToBase64(arrayBufferToUint8Array(encode(contentMap)));

    return {
      certificate: encodedCertificate,
      contentMap: encodedContentMap
    };
  }
}
