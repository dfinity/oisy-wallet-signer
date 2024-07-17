import {afterEach, beforeEach, describe, MockInstance} from 'vitest';
import {Signer, SignerParameters} from './signer';

describe('Signer', () => {
  let signer: Signer;
  const mockParameters: SignerParameters = {};

  beforeEach(() => {
    signer = Signer.connect(mockParameters);
  });

  afterEach(() => {
    signer.disconnect();
  });

  it('should init a signer', () => {
    expect(signer).toBeInstanceOf(Signer);
  });

  it('should add event listener for message on connect', () => {
    const addEventListenerSpy = vi.spyOn(window, 'addEventListener');

    Signer.connect(mockParameters);
    expect(addEventListenerSpy).toHaveBeenCalledWith('message', expect.any(Function));
  });

  it('should remove event listener for message on connect', () => {
    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

    const signer = Signer.connect(mockParameters);
    signer.disconnect();

    expect(removeEventListenerSpy).toHaveBeenCalledWith('message', expect.any(Function));
  });

  describe('onMessage', () => {
    const messageEvent = new MessageEvent('message', {
      data: 'test',
      origin: 'https://test.com'
    });

    let onMessageListenerSpy: MockInstance;

    beforeEach(() => {
      onMessageListenerSpy = vi.spyOn(signer as unknown as {onMessage: () => void}, 'onMessage');
    });

    afterEach(() => {
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
});
