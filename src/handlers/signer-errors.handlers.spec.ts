import type {Mock} from 'vitest';
import {SignerErrorCode} from '../constants/signer.constants';
import {JSON_RPC_VERSION_2, type RpcId, type RpcResponseWithError} from '../types/rpc';
import {
  notifyErrorPermissionNotGranted,
  notifyErrorRequestNotSupported
} from './signer-errors.handlers';

describe('Signer-errors.handlers', () => {
  let requestId: RpcId;

  const testOrigin = 'https://hello.com';

  let originalOpener: typeof window.opener;

  let postMessageMock: Mock;

  beforeEach(() => {
    originalOpener = window.opener;

    postMessageMock = vi.fn();

    vi.stubGlobal('opener', {postMessage: postMessageMock});

    requestId = crypto.randomUUID();
  });

  afterEach(() => {
    window.opener = originalOpener;

    vi.clearAllMocks();
  });

  describe('notifyErrorNotSupported', () => {
    it('should post an error message with default message when none is provided', () => {
      const error = {
        code: SignerErrorCode.REQUEST_NOT_SUPPORTED,
        message: 'The request sent by the relying party is not supported by the signer.'
      };

      notifyErrorRequestNotSupported({id: requestId, origin: testOrigin});

      const expectedMessage: RpcResponseWithError = {
        jsonrpc: JSON_RPC_VERSION_2,
        id: requestId,
        error
      };

      expect(postMessageMock).toHaveBeenCalledWith(expectedMessage, testOrigin);
    });

    it('should post an error message with custom message when provided', () => {
      const message = 'This is a test';

      const error = {
        code: SignerErrorCode.REQUEST_NOT_SUPPORTED,
        message
      };

      notifyErrorRequestNotSupported({id: requestId, origin: testOrigin, message});

      const expectedMessage: RpcResponseWithError = {
        jsonrpc: JSON_RPC_VERSION_2,
        id: requestId,
        error
      };

      expect(postMessageMock).toHaveBeenCalledWith(expectedMessage, testOrigin);
    });
  });

  describe('notifyErrorPermissionNotGranted', () => {
    it('should post an error message indicating permission not granted', () => {
      const error = {
        code: SignerErrorCode.PERMISSION_NOT_GRANTED,
        message:
          'The signer has not granted the necessary permissions to process the request from the relying party.'
      };

      notifyErrorPermissionNotGranted({id: requestId, origin: testOrigin});

      const expectedMessage: RpcResponseWithError = {
        jsonrpc: JSON_RPC_VERSION_2,
        id: requestId,
        error
      };

      expect(postMessageMock).toHaveBeenCalledWith(expectedMessage, testOrigin);
    });
  });
});
