import {Expiry, HttpAgentRequest, HttpAgentRequestTransformFn} from '@dfinity/agent';
import {isNullish, nowInBigIntNanoSeconds, uint8ArrayToBase64} from '@dfinity/utils';
import {IcrcCallCanisterRequestParams} from '../types/icrc-requests';
import {HexString} from '../types/hex-string';
import {generateHash} from '../utils/crypto.utils';

const MAX_CACHE_SIZE = 50;

/**
 * A custom transform function that processes the HTTP agent request.
 *
 * This transform function is intended to be used with the HttpAgent. It caches the expiry
 * time of requests based on a hash of the request data and checks whether the cache is expired.
 * If the cache is expired, it throws an error. If the cache is not expired, it reuses the cached
 * expiry value.
 *
 * @returns {HttpAgentRequestTransformFn} The transform function that processes the request.
 */
export const customAddTransform = (): HttpAgentRequestTransformFn => {
  const cache: Map<HexString, Expiry> = new Map();

  /**
   * Cleans up expired entries from the cache.
   * This function iterates over the cache and removes entries where the expiry time has passed.
   * The cleanup is triggered before each transformation to ensure the cache does not grow uncontrollably.
   */
  const cleanupExpiredCache = () => {
    const currentNanoTime = nowInBigIntNanoSeconds();

    for (const [key, expiry] of cache) {
      if (expiry['_value'] < currentNanoTime) {
        cache.delete(key);
      }
    }
  };

  return async (request: HttpAgentRequest) => {
    const {canister_id, sender, method_name, arg, ingress_expiry, nonce} = request.body;

    if (isNullish(nonce)) {
      return request;
    }

    const hashRequestData: IcrcCallCanisterRequestParams = {
      canisterId: canister_id.toString(),
      sender: sender.toString(),
      method: method_name,
      arg: uint8ArrayToBase64(arg),
      nonce: uint8ArrayToBase64(nonce)
    };

    const hash = await generateHash(hashRequestData);

    if (cache.size > MAX_CACHE_SIZE) {
      cleanupExpiredCache();
    }

    const cachedExpiry = cache.get(hash);

    if (isNullish(cachedExpiry)) {
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
