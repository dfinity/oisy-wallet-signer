import type {Mock} from 'vitest';
import type {IcrcReadyResponseType} from '../types/icrc-responses';
import {JSON_RPC_VERSION_2, RpcIdType} from '../types/rpc';
import {notifyReady} from './signer.handlers';

describe('Signer handlers', () => {
  let originalOpener: typeof window.opener;

  let postMessageMock: Mock;

  beforeEach(() => {
    originalOpener = window.opener;

    postMessageMock = vi.fn();

    vi.stubGlobal('opener', {postMessage: postMessageMock});
  });

  afterEach(() => {
    window.opener = originalOpener;

    vi.restoreAllMocks();
  });

  describe('notifyReady', () => {
    it('should post a message with the msg', () => {
      const id: RpcIdType = 'test-123';
      const origin = 'https://hello.com';

      notifyReady({id, origin});

      const expectedMessage: IcrcReadyResponseType = {
        jsonrpc: JSON_RPC_VERSION_2,
        id,
        result: 'ready'
      };

      expect(postMessageMock).toHaveBeenCalledWith(expectedMessage, origin);
    });
  });
});
