import type {Mock} from 'vitest';
import {SIGNER_SUPPORTED_STANDARDS, SignerErrorCode} from '../constants/signer.constants';
import type {
  IcrcWalletStatusRequest,
  IcrcWalletSupportedStandardsRequest
} from '../types/icrc-requests';
import type {IcrcReadyResponse, IcrcSupportedStandardsResponse} from '../types/icrc-responses';
import {JSON_RPC_VERSION_2, type RpcId, type RpcResponseWithError} from '../types/rpc';
import type {SignerMessageEvent} from '../types/signer';
import {handleStatusRequest, handleSupportedStandards, notifyError} from './signer.handlers';

describe('Signer handlers', () => {
  const id: RpcId = 'test-123';
  const origin = 'https://hello.com';

  const statusRequest: IcrcWalletStatusRequest = {
    jsonrpc: JSON_RPC_VERSION_2,
    id,
    method: 'icrc29_status'
  };

  const supportedStandardsRequest: IcrcWalletSupportedStandardsRequest = {
    jsonrpc: JSON_RPC_VERSION_2,
    id,
    method: 'icrc25_supported_standards'
  };

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
      const {handled} = handleStatusRequest({
        data: statusRequest,
        origin
      } as unknown as SignerMessageEvent);

      expect(handled).toBeTruthy();

      const expectedMessage: IcrcReadyResponse = {
        jsonrpc: JSON_RPC_VERSION_2,
        id,
        result: 'ready'
      };

      expect(postMessageMock).toHaveBeenCalledWith(expectedMessage, origin);
    });

    it('should not handle msg if not status request', () => {
      const {handled} = handleStatusRequest({
        data: supportedStandardsRequest,
        origin
      } as unknown as SignerMessageEvent);

      expect(handled).toBeFalsy();
    });
  });

  describe('notifyError', () => {
    it('should post the error', () => {
      const error = {
        code: SignerErrorCode.ORIGIN_ERROR,
        message: 'This is an error test.'
      };

      notifyError({id, origin, error});

      const expectedMessage: RpcResponseWithError = {
        jsonrpc: JSON_RPC_VERSION_2,
        id,
        error
      };

      expect(postMessageMock).toHaveBeenCalledWith(expectedMessage, origin);
    });
  });

  describe('notifySupportedStandards', () => {
    it('should post a message with the msg', () => {
      const {handled} = handleSupportedStandards({
        data: supportedStandardsRequest,
        origin
      } as unknown as SignerMessageEvent);

      expect(handled).toBeTruthy();

      const expectedMessage: IcrcSupportedStandardsResponse = {
        jsonrpc: JSON_RPC_VERSION_2,
        id,
        result: {
          supportedStandards: SIGNER_SUPPORTED_STANDARDS
        }
      };

      expect(postMessageMock).toHaveBeenCalledWith(expectedMessage, origin);
    });
    it('should not handle msg if not status request', () => {
      const {handled} = handleSupportedStandards({
        data: statusRequest,
        origin
      } as unknown as SignerMessageEvent);

      expect(handled).toBeFalsy();
    });
  });
});
