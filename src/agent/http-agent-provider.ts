import {HttpAgent, type HttpAgentOptions} from '@dfinity/agent';

/**
 * HttpAgentProvider class provides access to the HttpAgent instance and
 * allows initialization and retrieval of the agent.
 */
export class HttpAgentProvider {
  readonly #agent: HttpAgent;

  protected constructor(agent: HttpAgent) {
    this.#agent = agent;
  }

  /**
   * Creates an HttpAgentProvider with the provided options.
   * Optionally, you can request fetching of the root key with `shouldFetchRootKey`.
   *
   * @param {HttpAgentOptions} options - The options to configure the HttpAgent.
   * @param {boolean} [options.shouldFetchRootKey] - A flag indicating if the root key should be fetched.
   * @returns {Promise<HttpAgentProvider>} A promise that resolves to a new instance of HttpAgentProvider.
   */
  static async create(
    options?: HttpAgentOptions & {shouldFetchRootKey?: boolean}
  ): Promise<HttpAgentProvider> {
    const agent = await HttpAgent.create(options);
    return new HttpAgentProvider(agent);
  }

  /**
   * We need to expose the agent to create the actor for requesting the consent message.
   */
  get agent(): HttpAgent {
    return this.#agent;
  }
}
