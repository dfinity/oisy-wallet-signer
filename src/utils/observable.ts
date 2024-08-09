interface Observer<T> {
  id: symbol;
  callback: (data: T) => void;
}

export class Observable<T> {
  #observers: Observer<T>[] = [];

  next(data: T): void {
    this.#observers.forEach(({callback}) => {
      callback(data);
    });
  }

  subscribe({callback}: Pick<Observer<T>, 'callback'>): () => void {
    const observedId = Symbol();
    this.#observers.push({id: observedId, callback});

    return () => (this.#observers = this.#observers.filter(({id}) => id !== observedId));
  }
}
