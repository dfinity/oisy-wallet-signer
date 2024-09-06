import type {RpcResponseError, RpcResponseErrorCode} from './rpc';

export class RelyingPartyResponseError extends Error {
  code: RpcResponseErrorCode;

  constructor({message, code}: RpcResponseError) {
    super(message);

    this.code = code;
  }
}
