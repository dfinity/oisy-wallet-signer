import {Expiry, HttpAgentRequestTransformFn} from '@dfinity/agent';
import {base64ToUint8Array, nowInBigIntNanoSeconds, uint8ArrayToBase64} from '@dfinity/utils';
import {generateHash} from '../utils/crypto.utils';

export const customAddTransform = (): HttpAgentRequestTransformFn => {
  const cache: Map<string, Expiry> = new Map();

  return async (request) => {
    const {canister_id, sender, method_name, arg, ingress_expiry} = request.body;
    const nonce = method_name.split('::nonce::', 1)[0];
    const originalMethodName = method_name.replace(`${nonce}::nonce::`, '');

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
