import type {Mock} from 'vitest';
import {SignerErrorCode} from '../constants/signer.constants';
import {mockErrorNotify} from '../mocks/signer-error.mocks';
import {JSON_RPC_VERSION_2, type RpcId, type RpcResponseWithError} from '../types/rpc';
import {
  notifyErrorActionAborted,
  notifyErrorBusy,
  notifyErrorMissingPrompt,
  notifyErrorNotInitialized,
  notifyErrorPermissionNotGranted,
  notifyErrorRequestNotSupported,
  notifyErrorSenderNotAllowed,
  notifyNetworkError
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

  describe('notifyErrorActionAborted', () => {
    it('should post an error message indicating action was aborted', () => {
      notifyErrorActionAborted({id: requestId, origin: testOrigin});

      const expectedMessage: RpcResponseWithError = {
        jsonrpc: JSON_RPC_VERSION_2,
        id: requestId,
        error: mockErrorNotify
      };

      expect(postMessageMock).toHaveBeenCalledWith(expectedMessage, testOrigin);
    });
  });

  describe('notifyNetworkError', () => {
    it('should post an error message with a network error message', () => {
      const customMessage = 'Network request failed';
      const error = {
        code: SignerErrorCode.NETWORK_ERROR,
        message: customMessage
      };

      notifyNetworkError({id: requestId, origin: testOrigin, message: customMessage});

      const expectedMessage: RpcResponseWithError = {
        jsonrpc: JSON_RPC_VERSION_2,
        id: requestId,
        error
      };

      expect(postMessageMock).toHaveBeenCalledWith(expectedMessage, testOrigin);
    });
  });

  describe('notifyErrorMissingPrompt', () => {
    it('should post an error message indicating missing prompt registration', () => {
      const error = {
        code: SignerErrorCode.PERMISSIONS_PROMPT_NOT_REGISTERED,
        message: 'The signer has not registered a prompt to respond to permission requests.'
      };

      notifyErrorMissingPrompt({id: requestId, origin: testOrigin});

      const expectedMessage: RpcResponseWithError = {
        jsonrpc: JSON_RPC_VERSION_2,
        id: requestId,
        error
      };

      expect(postMessageMock).toHaveBeenCalledWith(expectedMessage, testOrigin);
    });
  });

  describe('notifyErrorSenderNotAllowed', () => {
    it('should post an error message indicating sender not allowed', () => {
      const error = {
        code: SignerErrorCode.SENDER_NOT_ALLOWED,
        message: 'The sender must match the owner of the signer.'
      };

      notifyErrorSenderNotAllowed({id: requestId, origin: testOrigin});

      const expectedMessage: RpcResponseWithError = {
        jsonrpc: JSON_RPC_VERSION_2,
        id: requestId,
        error
      };

      expect(postMessageMock).toHaveBeenCalledWith(expectedMessage, testOrigin);
    });
  });

  describe('notifyErrorBusy', () => {
    it('should post an error message indicating the signer is busy', () => {
      const error = {
        code: SignerErrorCode.BUSY,
        message:
          'The signer is currently processing a request and cannot handle new requests at this time.'
      };

      notifyErrorBusy({id: requestId, origin: testOrigin});

      const expectedMessage: RpcResponseWithError = {
        jsonrpc: JSON_RPC_VERSION_2,
        id: requestId,
        error
      };

      expect(postMessageMock).toHaveBeenCalledWith(expectedMessage, testOrigin);
    });
  });

  describe('notifyErrorNotInitialized', () => {
    it('should post an error message indicating the signer is not initialized (owner missing)', () => {
      const error = {
        code: SignerErrorCode.NOT_INITIALIZED,
        message: 'The signer does not have an owner set.'
      };

      notifyErrorNotInitialized({id: requestId, origin: testOrigin});

      const expectedMessage: RpcResponseWithError = {
        jsonrpc: JSON_RPC_VERSION_2,
        id: requestId,
        error
      };

      expect(postMessageMock).toHaveBeenCalledWith(expectedMessage, testOrigin);
    });
  });
});
