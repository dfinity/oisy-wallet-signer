import {
  Certificate,
  HttpAgent,
  defaultStrategy,
  lookupResultToBuffer,
  pollForResponse as pollForResponseAgent,
  type HttpAgentOptions,
  type SubmitResponse
} from '@dfinity/agent';
import {bufFromBufLike} from '@dfinity/candid';
import {Principal} from '@dfinity/principal';
import {base64ToUint8Array, isNullish, nonNullish} from '@dfinity/utils';
import type {IcrcCallCanisterRequestParams} from '../types/icrc-requests';
import {customAddTransform} from './customTransform-agent';
import {HttpAgentProvider} from './vanilla-agent';

export type CustomHttpAgentResponse = Pick<Required<SubmitResponse>, 'requestDetails'> & {
  certificate: Certificate;
};

export class CustomHttpAgent extends HttpAgentProvider {
  static async create(
    options?: HttpAgentOptions & {shouldFetchRootKey?: boolean}
  ): Promise<CustomHttpAgent> {
    const base = await HttpAgentProvider.create(options);
    return new CustomHttpAgent(base.getAgent());
  }

  constructor(agent: HttpAgent) {
    super(agent);
    agent.addTransform('update', customAddTransform());
  }

  async request({
    arg,
    canisterId,
    method: methodName,
    nonce
  }: IcrcCallCanisterRequestParams): Promise<CustomHttpAgentResponse> {
    const modifiedMethodName = `${nonce ?? ''}::nonce::${methodName}`;
    const {requestDetails, ...restResponse} = await this.agent.call(canisterId, {
      methodName: modifiedMethodName,
      arg: base64ToUint8Array(arg),
      effectiveCanisterId: canisterId
    });    

    if (isNullish(requestDetails)) {
      throw new Error('UndefinedRequestDetailsError');
    }

    const result = await this.readResponse({
      callResponse: {requestDetails, ...restResponse},
      canisterId
    });

    if (nonNullish(result)) {
      return result;
    }

    const {
      response: {status}
    } = restResponse;
    if (status === 202) {
      return await this.pollForResponse({
        callResponse: {requestDetails, ...restResponse},
        canisterId
      });
    }

    throw new Error('RequestError');
  }

  private async readResponse({
    callResponse: {
      requestId,
      response: {body, status},
      requestDetails
    },
    canisterId
  }: {callResponse: Required<SubmitResponse>} & Pick<
    IcrcCallCanisterRequestParams,
    'canisterId'
  >): Promise<CustomHttpAgentResponse | undefined> {
    if (isNullish(body) || !('certificate' in body)) {
      return undefined;
    }
    if (status !== 200) {
      throw new Error('InvalidCertificateStatusError');
    }

    const {certificate: cert} = body;
    if (isNullish(this.agent.rootKey)) {
      throw new Error('UndefinedRootKeyError');
    }

    const certificate = await Certificate.create({
      certificate: bufFromBufLike(cert),
      rootKey: this.agent.rootKey,
      canisterId: Principal.fromText(canisterId)
    });

    const {result: replyCheck} = this.assertReply({
      certificate,
      requestId
    });

    if (replyCheck !== 'valid') {
      throw new Error('InvalidCertificateReplyError');
    }

    return {certificate, requestDetails};
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
      case 'replied': {
        const reply = lookupResultToBuffer(certificate.lookup([...path, 'reply']));
        return {result: nonNullish(reply) ? 'valid' : 'invalid'};
      }
      case 'rejected':
        return {result: 'rejected'};
      default:
        return {result: 'empty'};
    }
  }

  private async pollForResponse({
    callResponse: {requestId, requestDetails},
    canisterId
  }: {callResponse: Pick<Required<SubmitResponse>, 'requestId' | 'requestDetails'>} & Pick<
    IcrcCallCanisterRequestParams,
    'canisterId'
  >): Promise<CustomHttpAgentResponse> {
    const {certificate} = await pollForResponseAgent(
      this.agent,
      Principal.fromText(canisterId),
      requestId,
      defaultStrategy()
    );

    return {certificate, requestDetails};
  }
}
