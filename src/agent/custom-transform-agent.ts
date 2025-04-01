import {Expiry, HttpAgentRequest, HttpAgentRequestTransformFn} from '@dfinity/agent';
import {isNullish, nowInBigIntNanoSeconds, uint8ArrayToBase64} from '@dfinity/utils';
import {HexString} from '../types/hex-string';
import {IcrcCallCanisterRequestParams} from '../types/icrc-requests';
import {generateHash} from '../utils/crypto.utils';

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
    const cachedExpiry = cache.get(hash);

    /* If no nonce is provided, we don't need to cache or check expiry, so we return the request as is.
     This behavior is by design, as nonces are necessary for identifying unique requests and ensuring
     cache correctness.
    */
    if (isNullish(cachedExpiry)) {
      cache.set(hash, ingress_expiry);
      return request;
    }

    if (cachedExpiry['_value'] <= nowInBigIntNanoSeconds()) {
      throw Error(
        'The request has expired and is no longer valid. Please try again with a new request.'
      );
    }

    request.body.ingress_expiry = cachedExpiry;

    return request;
  };
};
