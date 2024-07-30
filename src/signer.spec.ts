import {type MockInstance} from 'vitest';
import * as signerHandlers from './handlers/signer.handlers';
import {Signer, type SignerParameters} from './signer';
import {ICRC29_STATUS} from './types/icrc';
import {JSON_RPC_VERSION_2} from './types/rpc';

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
    });

    it('should process message when a message event is received', () => {
      window.dispatchEvent(messageEvent);

      expect(onMessageListenerSpy).toHaveBeenCalledWith(messageEvent);
    });

    it('should not process message when a message event is received', () => {
      signer.disconnect();

      window.dispatchEvent(messageEvent);

      expect(onMessageListenerSpy).not.toHaveBeenCalled();
    });
  });

  describe('assertAndSetOrigin', () => {
    let notifyReadySpy: MockInstance;
    let signer: Signer;

    beforeEach(() => {
      signer = Signer.init(mockParameters);
      notifyReadySpy = vi.spyOn(signerHandlers, 'notifyReady');
    });

    afterEach(() => {
      signer.disconnect();
      vi.clearAllMocks();
    });

    it('should set the origin if it is not set', () => {
      const testOrigin = 'https://hello.com';

      let testId = 'test-123';

      const messageEvent = new MessageEvent('message', {
        data: {
          id: testId,
          jsonrpc: JSON_RPC_VERSION_2,
          method: ICRC29_STATUS
        },
        origin: testOrigin
      });

      window.dispatchEvent(messageEvent);

      expect(notifyReadySpy).toHaveBeenCalledWith({
        id: testId,
        origin: testOrigin
      });
    });
  });
});
