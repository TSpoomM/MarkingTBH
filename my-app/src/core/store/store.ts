export type StoreListener = () => void;

/**
 * Minimal observable state holder shared by every page controller.
 * Views subscribe to it; only the controller is allowed to write state.
 */
export default abstract class Store<S> {
  protected state: S;
  private readonly listeners = new Set<StoreListener>();
  private initialized = false;

  protected constructor(initialState: S) {
    this.state = initialState;
  }

  subscribe = (listener: StoreListener) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  getSnapshot = () => this.state;

  protected setState(patch: Partial<S>) {
    this.state = { ...this.state, ...patch };
    this.listeners.forEach((listener) => listener());
  }

  /** Runs load() exactly once, however many views mount against this store. */
  async initialize() {
    if (this.initialized) return;
    this.initialized = true;
    await this.load();
  }

  protected abstract load(): Promise<void>;
}
