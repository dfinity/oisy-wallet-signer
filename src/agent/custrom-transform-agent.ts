import {Expiry, HttpAgentRequestTransformFn} from '@dfinity/agent';
import {nowInBigIntNanoSeconds, uint8ArrayToBase64} from '@dfinity/utils';
import {HexString} from 'src/types/hex-string';
import {generateHash} from '../utils/crypto.utils';

export const customAddTransform = (): HttpAgentRequestTransformFn => {
  const cache: Map<HexString, Expiry> = new Map();

  return async (request) => {
    const {canister_id, sender, method_name, arg, ingress_expiry, nonce} = request.body;

    if (!nonce) {
      return request;
    }

    const hash = await generateHash({
      canisterId: canister_id.toString(),
      sender: sender.toString(),
      method: method_name,
      arg: uint8ArrayToBase64(arg),
      nonce: uint8ArrayToBase64(nonce)
    });

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
