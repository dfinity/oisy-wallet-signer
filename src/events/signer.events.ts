type SignerEventsCallback<T> = {id: symbol; callback: (data: T) => void};

export class SignerEvents<T> {
  #callbacks: SignerEventsCallback<T>[] = [];

  emit(data: T) {
    this.#callbacks.forEach(({callback}) => callback(data));
  }

  on({callback}: Pick<SignerEventsCallback<T>, 'callback'>): () => void {
    const callbackId = Symbol();
    this.#callbacks.push({id: callbackId, callback});

    return () => (this.#callbacks = this.#callbacks.filter(({id}) => id !== callbackId));
  }
}
