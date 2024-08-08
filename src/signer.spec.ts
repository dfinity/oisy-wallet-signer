import {type MockInstance} from 'vitest';
import {SIGNER_SUPPORTED_STANDARDS, SignerErrorCode} from './constants/signer.constants';
import * as signerHandlers from './handlers/signer.handlers';
import {Signer, type SignerParameters} from './signer';
import {ICRC25_SUPPORTED_STANDARDS, ICRC29_STATUS} from './types/icrc';
import {JSON_RPC_VERSION_2} from './types/rpc';
import type {SignerMessageEventData} from './types/signer';

describe('Signer', () => {
  const mockParameters: SignerParameters = {};

  it('should init a signer', () => {
    const signer = Signer.init(mockParameters);
    expect(signer).toBeInstanceOf(Signer);
    signer.disconnect();
  });

  it('should add event listener for message on connect', () => {
    const addEventListenerSpy = vi.spyOn(window, 'addEventListener');

    const signer = Signer.init(mockParameters);
    expect(addEventListenerSpy).toHaveBeenCalledWith('message', expect.any(Function));
    signer.disconnect();
  });

  it('should remove event listener for message on connect', () => {
    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

    const signer = Signer.init(mockParameters);
    signer.disconnect();

    expect(removeEventListenerSpy).toHaveBeenCalledWith('message', expect.any(Function));
  });

  describe('onMessage', () => {
    const messageEvent = new MessageEvent('message', {
      data: 'test',
      origin: 'https://test.com'
    });

    let onMessageListenerSpy: MockInstance;

    let signer: Signer;

    beforeEach(() => {
      signer = Signer.init(mockParameters);
      onMessageListenerSpy = vi.spyOn(signer as unknown as {onMessage: () => void}, 'onMessage');
    });

    afterEach(() => {
      signer.disconnect();
      onMessageListenerSpy.mockClear();

      vi.clearAllMocks();
    });

    it('should process message when a message event is received', () => {
      window.dispatchEvent(messageEvent);

      expect(onMessageListenerSpy).toHaveBeenCalledWith(messageEvent);
    });

    it('should not process message which are not RpcRequest', () => {
      const spyAssertAndSetOrigin = vi.spyOn(
        signer as unknown as {
          assertAndSetOrigin: (params: {origin: string; msgData: SignerMessageEventData}) => void;
        },
        'assertAndSetOrigin'
      );

      window.dispatchEvent(messageEvent);

      expect(spyAssertAndSetOrigin).not.toHaveBeenCalled();
    });

    it('should not process message when a message event is received', () => {
      signer.disconnect();

      window.dispatchEvent(messageEvent);

      expect(onMessageListenerSpy).not.toHaveBeenCalled();
    });
  });

  describe('Origin', () => {
    const testId = 'test-123';

    let originalOpener: typeof window.opener;

    let handleStatusRequestSpy: MockInstance;
    let signer: Signer;

    let postMessageMock: MockInstance;

    beforeEach(() => {
      signer = Signer.init(mockParameters);
      handleStatusRequestSpy = vi.spyOn(signerHandlers, 'handleStatusRequest');
      postMessageMock = vi.fn();
      vi.stubGlobal('opener', {postMessage: postMessageMock});
    });

    afterEach(() => {
      signer.disconnect();

      window.opener = originalOpener;

      vi.clearAllMocks();
      vi.restoreAllMocks();
    });

    it('should use the origin and respond with a post message', () => {
      const testOrigin = 'https://hello.com';

      const messageEvent = new MessageEvent('message', {
        data: {
          id: testId,
          jsonrpc: JSON_RPC_VERSION_2,
          method: ICRC29_STATUS
        },
        origin: testOrigin
      });

      window.dispatchEvent(messageEvent);

      expect(handleStatusRequestSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          data: messageEvent.data,
          origin: testOrigin
        })
      );
    });

    it('should notify an error if a message from different origin is dispatched', () => {
      const testOrigin = 'https://hello.com';
      const differentOrigin = 'https://test.com';

      const msg = {
        data: {
          id: testId,
          jsonrpc: JSON_RPC_VERSION_2,
          method: ICRC29_STATUS
        },
        origin: testOrigin
      };

      const messageEvent = new MessageEvent('message', msg);
      window.dispatchEvent(messageEvent);

      const messageEventDiff = new MessageEvent('message', {...msg, origin: differentOrigin});
      window.dispatchEvent(messageEventDiff);

      expect(postMessageMock).toHaveBeenCalledWith(
        {
          jsonrpc: JSON_RPC_VERSION_2,
          id: testId,
          error: {
            code: 500,
            message: "The relying party's origin is not allowed to interact with the signer."
          }
        },
        differentOrigin
      );
    });

    it('should reset #walletOrigin to null after disconnect', () => {
      const testOrigin = 'https://hello.com';
      const differentOrigin = 'https://world.com';

      const msg = {
        data: {
          id: testId,
          jsonrpc: JSON_RPC_VERSION_2,
          method: ICRC29_STATUS
        },
        origin: testOrigin
      };

      const messageEvent = new MessageEvent('message', msg);
      window.dispatchEvent(messageEvent);

      const messageEventDiff = new MessageEvent('message', {...msg, origin: differentOrigin});

      signer.disconnect();

      expect(() => {
        window.dispatchEvent(messageEventDiff);
      }).not.toThrow();
    });
  });

  describe('Exchange postMessage', () => {
    const testId = 'test-123';
    const testOrigin = 'https://hello.com';

    let originalOpener: typeof window.opener;

    let signer: Signer;

    let postMessageMock: MockInstance;

    beforeEach(() => {
      signer = Signer.init(mockParameters);

      postMessageMock = vi.fn();

      vi.stubGlobal('opener', {postMessage: postMessageMock});
    });

    afterEach(() => {
      signer.disconnect();

      window.opener = originalOpener;

      vi.clearAllMocks();
      vi.restoreAllMocks();
    });

    it('should notify READY for icrc29_status', () => {
      const msg = {
        data: {
          id: testId,
          jsonrpc: JSON_RPC_VERSION_2,
          method: ICRC29_STATUS
        },
        origin: testOrigin
      };

      const messageEvent = new MessageEvent('message', msg);
      window.dispatchEvent(messageEvent);

      expect(postMessageMock).toHaveBeenCalledWith(
        {
          jsonrpc: JSON_RPC_VERSION_2,
          id: testId,
          result: 'ready'
        },
        testOrigin
      );
    });

    it('should notify supported standards for icrc25_supported_standards', () => {
      const msg = {
        data: {
          id: testId,
          jsonrpc: JSON_RPC_VERSION_2,
          method: ICRC25_SUPPORTED_STANDARDS
        },
        origin: testOrigin
      };

      const messageEvent = new MessageEvent('message', msg);
      window.dispatchEvent(messageEvent);

      expect(postMessageMock).toHaveBeenCalledWith(
        {
          jsonrpc: JSON_RPC_VERSION_2,
          id: testId,
          result: {
            supportedStandards: SIGNER_SUPPORTED_STANDARDS
          }
        },
        testOrigin
      );
    });

    it('should notify REQUEST_NOT_SUPPORTED', () => {
      const testOrigin = 'https://hello.com';

      const msg = {
        data: {
          id: testId,
          jsonrpc: JSON_RPC_VERSION_2,
          method: 'this_is_not_supported'
        },
        origin: testOrigin
      };

      const messageEvent = new MessageEvent('message', msg);
      window.dispatchEvent(messageEvent);

      expect(postMessageMock).toHaveBeenCalledWith(
        {
          jsonrpc: JSON_RPC_VERSION_2,
          id: testId,
          error: {
            code: SignerErrorCode.REQUEST_NOT_SUPPORTED,
            message: 'The request sent by the relying party is not supported by the signer.'
          }
        },
        testOrigin
      );
    });
  });
});
