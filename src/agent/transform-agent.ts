import {
  Expiry,
  HttpAgent,
  HttpAgentOptions,
  HttpAgentRequestTransformFn,
  Identity,
  SubmitResponse
} from '@dfinity/agent';
import {Principal} from '@dfinity/principal';
import {
  base64ToUint8Array,
  isNullish,
  nowInBigIntNanoSeconds,
  uint8ArrayToBase64
} from '@dfinity/utils';
import {generateHash} from '../utils/crypto.utils';

/**
 * Option 1
 */

export const customTransform = (): HttpAgentRequestTransformFn => {
  const cache: Map<string, Expiry> = new Map();

  return async (request) => {
    const {canister_id, sender, method_name, arg, ingress_expiry} = request.body;
    const [originalMethodName, nonce] = method_name.split('::nonce::');

    request.body.method_name = originalMethodName;

    if (!nonce) {
      return request;
    }

    const hash = await generateHash({
      canisterId: canister_id.toString(),
      sender: sender.toString(),
      method: method_name,
      arg: uint8ArrayToBase64(arg),
      nonce
    });

    request.body.nonce = base64ToUint8Array(nonce);

    const cachedExpiry = cache.get(hash);

    if (!cachedExpiry) {
      cache.set(hash, ingress_expiry);
      return request;
    }

    if (cachedExpiry['_value'] < nowInBigIntNanoSeconds()) {
      throw Error('Ingress Expiry has been expired.');
    }

    request.body.ingress_expiry = cachedExpiry;

    return request;
  };
};

/**
 * Option 2
 */

// @override
export class HttpTransformedAgent extends HttpAgent {
  #cache: Map<string, Expiry> = new Map();

  // @override
  public static createSync(options: HttpAgentOptions = {}): HttpTransformedAgent {
    return new this({...options});
  }

  public static async create(
    options: HttpAgentOptions = {
      shouldFetchRootKey: false
    }
  ): Promise<HttpTransformedAgent> {
    const agent = HttpTransformedAgent.createSync(options);
    const initPromises: Promise<ArrayBuffer | void>[] = [agent.syncTime()];
    if (agent.host.toString() !== 'https://icp-api.io' && options.shouldFetchRootKey) {
      initPromises.push(agent.fetchRootKey());
    }
    await Promise.all(initPromises);
    return agent;
  }

  // @override
  async call(
    canisterId: Principal | string,
    options: {
      methodName: string;
      arg: ArrayBuffer;
      effectiveCanisterId?: Principal | string;
      callSync?: boolean;
    },
    identity?: Identity | Promise<Identity>
  ): Promise<SubmitResponse> {
    this.noCustomTransform();
    return await super.call(canisterId, options, identity);
  }

  callWithPotentialNonce = async (
    nonce: string | undefined,
    canisterId: Principal | string,
    options: {
      methodName: string;
      arg: ArrayBuffer;
      effectiveCanisterId?: Principal | string;
      callSync?: boolean;
    },
    identity?: Identity | Promise<Identity>
  ): Promise<SubmitResponse> => {
    if (isNullish(nonce)) {
      this.noCustomTransform();
    } else {
      this.customTransform(nonce);
    }

    return await super.call(canisterId, options, identity);
  };

  private noCustomTransform(): HttpAgentRequestTransformFn {
    return async (request) => {
      return request;
    };
  }

  private customTransform(nonce: string): HttpAgentRequestTransformFn {
    return async (request) => {
      const {canister_id, sender, method_name, arg, ingress_expiry} = request.body;

      const hash = await generateHash({
        canisterId: canister_id.toString(),
        sender: sender.toString(),
        method: method_name,
        arg: uint8ArrayToBase64(arg),
        nonce
      });

      request.body.nonce = base64ToUint8Array(nonce);

      const cachedExpiry = this.#cache.get(hash);

      if (!cachedExpiry) {
        this.#cache.set(hash, ingress_expiry);
        return request;
      }

      if (cachedExpiry['_value'] < nowInBigIntNanoSeconds()) {
        throw Error('Ingress Expiry has been expired.');
      }

      request.body.ingress_expiry = cachedExpiry;

      return request;
    };
  }
}
