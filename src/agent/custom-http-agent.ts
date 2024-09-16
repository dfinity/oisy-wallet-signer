import {Certificate, HttpAgent, lookupResultToBuffer, SubmitResponse} from '@dfinity/agent';
import {bufFromBufLike} from '@dfinity/candid';
import {Principal} from '@dfinity/principal';
import {isNullish} from '@dfinity/utils';
import {IcrcCallCanisterRequestParams} from '../types/icrc-requests';

export class CustomHttpAgent extends HttpAgent {
  request = async ({
    arg,
    canisterId,
    method: methodName
  }: Pick<IcrcCallCanisterRequestParams, 'canisterId' | 'method' | 'arg'>): Promise<void> => {
    if (isNullish(this.rootKey)) {
      throw new Error('Agent root key not initialized before making call');
    }

    const callResponse = await this.call(canisterId, {
      methodName,
      arg,
      // effectiveCanisterId optional but, actually mandatory.
      effectiveCanisterId: canisterId
    });

    const result = await this.readResponse({
      callResponse,
      canisterId
    })

    // I assume that if we get a result at this point, it means we can respond to the caller. However, this is not how it's handled in Agent-js. For some reason, regardless of whether they get a result at this point, if the response has a status of 202, they overwrite the result, which seems incorrect.

    // Fall back to polling if we receive an Accepted response code
    if (response.status === 202) {
    }
  };

  private async readResponse({
    callResponse: {
      requestId,
      response: {body}
    },
    canisterId
  }: {callResponse: SubmitResponse} & Pick<
    IcrcCallCanisterRequestParams,
    'canisterId'
  >): Promise<undefined> {
    if (isNullish(body) || isNullish(body.certificate)) {
      return undefined;
    }

    const {certificate: cert} = body;

    const certificate = await Certificate.create({
      certificate: bufFromBufLike(cert),
      rootKey: this.rootKey,
      canisterId: Principal.fromText(canisterId)
    });

    const path = [new TextEncoder().encode('request_status'), requestId];

    const status = new TextDecoder().decode(
      lookupResultToBuffer(certificate.lookup([...path, 'status']))
    );

    switch (status) {
      case 'replied':
        reply = lookupResultToBuffer(certificate.lookup([...path, 'reply']));
        break;
      case 'rejected':
        throw new UpdateCallRejectedError(cid, methodName, requestId, response);
      default:
        // I'm not sure why undefined would be an acceptable result for this default implementation, but that's what Agent-js does.
        return undefined;
    }
  }
}
