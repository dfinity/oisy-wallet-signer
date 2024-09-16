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
import {encode} from './agentjs-cbor-copy';

export class CustomHttpAgent extends HttpAgent {
  request = async ({
    arg,
    canisterId,
    method: methodName
  }: Pick<
    IcrcCallCanisterRequestParams,
    'canisterId' | 'method' | 'arg'
  >): Promise<IcrcCallCanisterResult> => {
    if (isNullish(this.rootKey)) {
      throw new Error('Agent root key not initialized before making call');
    }

    const callResponse = await this.call(canisterId, {
      methodName,
      arg,
      // effectiveCanisterId is optional but, actually mandatory according SDK team.
      effectiveCanisterId: canisterId
    });

    const result = await this.readResponse({
      callResponse,
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
    } = callResponse;

    // Fall back to polling if we receive an Accepted response code
    if (status === 202) {
      const result = await this.pollForResponse({callResponse, canisterId});

      const contentMap = toBase64(cbor.encode(allResponse.requestDetails));
      const certificate = toBase64(cbor.encode(result.certificate.cert));

      return {
        contentMap,
        certificate
      };
    }

    throw new Error(`Call was returned undefined, but type [${func.retTypes.join(',')}].`);
  };

  private async readResponse({
    callResponse: {
      requestId,
      response: {body},
      requestDetails: contentMap
    },
    canisterId
  }: {callResponse: SubmitResponse} & Pick<IcrcCallCanisterRequestParams, 'canisterId'>): Promise<
    IcrcCallCanisterResult | undefined
  > {
    // Certificate is only support in v3.
    if (isNullish(body) || isNullish(body.certificate)) {
      return undefined;
    }

    if (isNullish(contentMap)) {
      // TODO proper error
      throw new Error('Empty content map');
    }

    // I'm not sure why we don't check the response status, 202, before trying to search for a certificate. This seems inaccurate, but that's how Agent-js handles it.

    const {certificate: cert} = body;

    const certificate = await Certificate.create({
      certificate: bufFromBufLike(cert),
      rootKey: this.rootKey,
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

    const encodedCertificate = arrayBufferToUint8Array(encode(certificate));
    const encodedContentMap = arrayBufferToUint8Array(encode(contentMap));

    return {
      certificate: encodedCertificate,
      contentMap: encodedContentMap
    };
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
    callResponse: {requestId},
    canisterId
  }: {callResponse: SubmitResponse} & Pick<
    IcrcCallCanisterRequestParams,
    'canisterId'
  >): Promise<undefined> {
    return await pollForResponseAgent(
      this,
      Principal.fromText(canisterId),
      requestId,
      defaultStrategy()
    );
  }
}
