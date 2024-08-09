import {Observable} from './observable';

describe('Observable', () => {
  it('should notify all subscribers with the correct data', () => {
    const observable = new Observable<number>();
    const callback1 = vi.fn();
    const callback2 = vi.fn();

    observable.subscribe({callback: callback1});
    observable.subscribe({callback: callback2});

    observable.next(5);

    expect(callback1).toHaveBeenNthCalledWith(1, 5);
    expect(callback2).toHaveBeenNthCalledWith(1, 5);
  });

  it('should allow subscribers to unsubscribe', () => {
    const observable = new Observable<number>();
    const callback = vi.fn();

    const unsubscribe = observable.subscribe({callback});

    observable.next(1);
    unsubscribe();
    observable.next(2);

    expect(callback).toHaveBeenNthCalledWith(1, 1);
  });

  it('should not notify unsubscribed observers', () => {
    const observable = new Observable<number>();
    const callback1 = vi.fn();
    const callback2 = vi.fn();

    const unsubscribe1 = observable.subscribe({callback: callback1});
    observable.subscribe({callback: callback2});

    unsubscribe1();
    observable.next(10);

    expect(callback1).not.toHaveBeenCalled();
    expect(callback2).toHaveBeenNthCalledWith(1, 10);
  });

  it('should handle multiple subscriptions and unsubscriptions', () => {
    const observable = new Observable<number>();
    const callback1 = vi.fn();
    const callback2 = vi.fn();
    const callback3 = vi.fn();

    const unsubscribe1 = observable.subscribe({callback: callback1});
    const unsubscribe2 = observable.subscribe({callback: callback2});
    observable.subscribe({callback: callback3});

    observable.next(20);

    unsubscribe1();
    unsubscribe2();

    observable.next(30);

    expect(callback1).toHaveBeenNthCalledWith(1, 20);
    expect(callback2).toHaveBeenNthCalledWith(1, 20);

    expect(callback3).toHaveBeenCalledTimes(2);
    expect(callback3).toHaveBeenCalledWith(20);
    expect(callback3).toHaveBeenCalledWith(30);
  });
});
