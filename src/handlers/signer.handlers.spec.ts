import type {Mock} from 'vitest';
import {SignerErrorCode} from '../constants/signer.constants';
import type {IcrcReadyResponse} from '../types/icrc-responses';
import {JSON_RPC_VERSION_2, type RpcId, type RpcResponseWithError} from '../types/rpc';
import {notify, notifyError} from './signer.handlers';

describe('Signer handlers', () => {
  let id: RpcId;
  const origin = 'https://hello.com';

  let sourceMock: Window;

  let postMessageMock: Mock;

  beforeEach(() => {
    id = crypto.randomUUID();

    postMessageMock = vi.fn();

    sourceMock = {
      postMessage: postMessageMock
    } as unknown as Window;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('notifyError', () => {
    it('should post the error', () => {
      const error = {
        code: SignerErrorCode.ORIGIN_ERROR,
        message: 'This is an error test.'
      };

      notifyError({id, origin, error, source: sourceMock});

      const expectedMessage: RpcResponseWithError = {
        jsonrpc: JSON_RPC_VERSION_2,
        id,
        error
      };

      expect(postMessageMock).toHaveBeenCalledWith(expectedMessage);
    });
  });

  describe('notify', () => {
    it('should post a message with the correct msg and origin', () => {
      const msg: IcrcReadyResponse = {
        jsonrpc: JSON_RPC_VERSION_2,
        id,
        result: 'ready'
      };

      notify({msg, origin, source: sourceMock});

      expect(postMessageMock).toHaveBeenCalledWith(msg);
    });
  });
});
