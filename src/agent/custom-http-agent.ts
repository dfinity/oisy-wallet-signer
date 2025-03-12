import {
  Certificate,
  Expiry,
  HttpAgent,
  Nonce,
  defaultStrategy,
  lookupResultToBuffer,
  makeExpiryTransform,
  makeNonceTransform,
  pollForResponse as pollForResponseAgent,
  type CallRequest,
  type HttpAgentOptions,
  type SubmitResponse
} from '@dfinity/agent';
import {bufFromBufLike} from '@dfinity/candid';
import {Principal} from '@dfinity/principal';
import {base64ToUint8Array, isNullish, nonNullish} from '@dfinity/utils';
import {DEFAULT_EXPIRY_DURATION} from '../constants/http-agent.constants';
import type {IcrcCallCanisterRequestParams} from '../types/icrc-requests';
import {generateHash} from '../utils/crypto.utils';
import {expiryToMs} from '../utils/custom-http-agent.utils';

export type CustomHttpAgentResponse = Pick<Required<SubmitResponse>, 'requestDetails'> & {
  certificate: Certificate;
};

export class UndefinedRequestDetailsError extends Error {}
export class RequestError extends Error {}
export class InvalidCertificateReplyError extends Error {}
export class InvalidCertificateStatusError extends Error {}
export class UndefinedRootKeyError extends Error {}

// To extend the HttpAgent, we would have to override the static create function.
// While this is possible, it would require using Object.assign to clone the HttpAgent into a CustomHttpAgent, because the super function does not accept generics.
// Therefore, it is cleaner in my opinion to encapsulate the agent rather than extend it.
export class CustomHttpAgent {
  readonly #agent: HttpAgent;
  #cache: Map<string, Expiry>;

  private constructor(agent: HttpAgent) {
    this.#agent = agent;
    this.#cache = new Map();
  }

  static async create(
    options?: HttpAgentOptions & {
      shouldFetchRootKey?: boolean;
    }
  ): Promise<CustomHttpAgent> {
    const agent = await HttpAgent.create(options);
    return new CustomHttpAgent(agent);
  }

  /**
   * We need to expose the agent to create the actor for requesting the consent message.
   */
  get agent(): HttpAgent {
    return this.#agent;
  }

  request = async ({
    arg,
    canisterId,
    method: methodName,
    nonce,
    sender
  }: IcrcCallCanisterRequestParams): Promise<CustomHttpAgentResponse> => {
    const hash = await generateHash({canisterId, sender, method: methodName, arg, nonce});
    const ingressExpiry = this.getIngressExpiry({hash, nonce});

    this.attachRequestNonce({nonce});
    this.attachAddTransformExpiry(ingressExpiry);

    const {requestDetails, ...restResponse} = await this.#agent.call(canisterId, {
      methodName,
      arg: base64ToUint8Array(arg),
      // effectiveCanisterId is optional but, actually mandatory according SDK team.
      effectiveCanisterId: canisterId
    });

    this.assertRequestDetails(requestDetails);

    if (isNullish(requestDetails)) {
      throw new UndefinedRequestDetailsError();
    }

    const result = await this.readResponse({
      callResponse: {requestDetails, ...restResponse},
      canisterId
    });

    this.cleanCacheAfterCall();

    // I assume that if we get a result at this point, it means we can respond to the caller.
    // However, this is not how it's handled in Agent-js. For some reason, regardless of whether they get a result at this point or not, if the response has a status of 202, they overwrite the result with pollForResponse, which seems incorrect.
    // That is why we return the result if we get one.
    // @see agent-js: https://github.com/dfinity/agent-js/blob/21cf4700eff1de7f6f15304b758a16e5881afca3/packages/agent/src/actor.ts#L567
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

    throw new RequestError();
  };

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
    // Certificate is only support in v3.
    if (isNullish(body) || !('certificate' in body)) {
      return undefined;
    }

    // A response with a body.certificate is valid only for status 200 according specification
    // https://github.com/dfinity/interface-spec/pull/265
    if (status !== 200) {
      throw new InvalidCertificateStatusError();
    }

    // I'm not sure why we don't check the response status, 202, before trying to search for a certificate. This seems inaccurate, but that's how Agent-js handles it.
    // @see agent-js: https://github.com/dfinity/agent-js/blob/21cf4700eff1de7f6f15304b758a16e5881afca3/packages/agent/src/actor.ts#L545

    const {certificate: cert} = body;

    if (isNullish(this.#agent.rootKey)) {
      throw new UndefinedRootKeyError();
    }

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
      throw new InvalidCertificateReplyError();
    }

    return {certificate, requestDetails};
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
        // ESLint disabled because this code is copy/pasted without changes from agent-js.
        // eslint-disable-next-line no-case-declarations
        const reply = lookupResultToBuffer(certificate.lookup([...path, 'reply']));
        return {result: nonNullish(reply) ? 'valid' : 'invalid'};
      case 'rejected':
        return {result: 'rejected'};
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
  >): Promise<CustomHttpAgentResponse> {
    const {certificate} = await pollForResponseAgent(
      this.#agent,
      Principal.fromText(canisterId),
      requestId,
      defaultStrategy()
    );

    return {certificate, requestDetails};
  }

  private attachRequestNonce({nonce}: Pick<IcrcCallCanisterRequestParams, 'nonce'>): void {
    if (isNullish(nonce)) {
      // Consumer has not provided a nonce. Therefore, we let agent-js generate one for the request.
      return;
    }

    this.#agent.addTransform(
      'update',
      makeNonceTransform((): Nonce => base64ToUint8Array(nonce) as Nonce)
    );
  }
  private attachAddTransformExpiry(expiry: number): void {
    this.#agent.addTransform('update', makeExpiryTransform(expiry));
  }

  private getIngressExpiry({hash, nonce}: {hash: string; nonce?: string}): number {
    if (isNullish(nonce)){ 
      return DEFAULT_EXPIRY_DURATION
    };

    const existingExpiry = this.#cache.get(hash);

        // TODO: Should we try with a new expiry or reject the request if the timestamp is expired?
    if (!existingExpiry || expiryToMs(existingExpiry) <= Date.now()) {
      return this.createAndStoreNewExpiry(hash);
    }

    return expiryToMs(existingExpiry) - Date.now();
  }

  private createAndStoreNewExpiry(hash: string): number {
    const newExpiry = new Expiry(DEFAULT_EXPIRY_DURATION);
    this.#cache.set(hash, newExpiry);
    return DEFAULT_EXPIRY_DURATION;
  }

  private cleanCacheAfterCall(): void {
    const now = Date.now();

    for (const [key, expiry] of this.#cache.entries()) {
      if (expiryToMs(expiry) <= now) {
        this.#cache.delete(key);
      }
    }
  }
}
