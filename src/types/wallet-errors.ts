import type {RpcResponseError, RpcResponseErrorCode} from './rpc';

export class WalletResponseError extends Error {
  code: RpcResponseErrorCode;

  constructor({message, code}: RpcResponseError) {
    super(message);

    this.code = code;
  }
}
