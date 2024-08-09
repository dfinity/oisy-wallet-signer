type ObservableCallback<T> = {id: symbol; callback: (data: T) => void};

export class Observable<T> {
  #callbacks: ObservableCallback<T>[] = [];

  next(data: T): void {
    this.#callbacks.forEach(({callback}) => callback(data));
  }

  subscribe({callback}: Pick<ObservableCallback<T>, 'callback'>): () => void {
    const callbackId = Symbol();
    this.#callbacks.push({id: callbackId, callback});

    return () => (this.#callbacks = this.#callbacks.filter(({id}) => id !== callbackId));
  }
}
