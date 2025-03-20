import {Certificate, HttpAgent, type HttpAgentOptions, type SubmitResponse} from '@dfinity/agent';

export type CustomHttpAgentResponse = Pick<Required<SubmitResponse>, 'requestDetails'> & {
  certificate: Certificate;
};

export class HttpAgentProvider {
  readonly agent: HttpAgent;

  constructor(agent: HttpAgent) {
    this.agent = agent;
  }

  static async create(
    options?: HttpAgentOptions & {shouldFetchRootKey?: boolean}
  ): Promise<HttpAgentProvider> {
    const agent = await HttpAgent.create(options);
    return new HttpAgentProvider(agent);
  }

  getAgent(): HttpAgent {
    return this.agent;
  }
}
