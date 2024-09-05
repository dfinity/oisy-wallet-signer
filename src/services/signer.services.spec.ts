import {beforeEach, type Mock} from 'vitest';
import {SignerErrorCode} from '../constants/signer.constants';
import {JSON_RPC_VERSION_2, type RpcId, type RpcResponseWithError} from '../types/rpc';
import {notifyErrorPermissionNotGranted} from './signer.services';

describe('Signer services', () => {
  let requestId: RpcId;

  beforeEach(() => {
    requestId = crypto.randomUUID();
  });

  describe('notifyErrorPermissionNotGranted', () => {
    const origin = 'https://hello.com';

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

    it('should post an error message indicating permission not granted', () => {
      const error = {
        code: SignerErrorCode.PERMISSION_NOT_GRANTED,
        message:
          'The signer has not granted the necessary permissions to process the request from the relying party.'
      };

      notifyErrorPermissionNotGranted({id: requestId, origin});

      const expectedMessage: RpcResponseWithError = {
        jsonrpc: JSON_RPC_VERSION_2,
        id: requestId,
        error
      };

      expect(postMessageMock).toHaveBeenCalledWith(expectedMessage, origin);
    });
  });
});
