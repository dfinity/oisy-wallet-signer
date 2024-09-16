import {HttpAgent} from '@dfinity/agent';
import {IcrcCallCanisterRequestParams} from '../types/icrc-requests';

export class CustomHttpAgent extends HttpAgent {
  request = async ({
    canisterId,
    method: methodName
  }: Pick<IcrcCallCanisterRequestParams, 'canisterId' | 'method'>): Promise<void> => {
    const {requestId, response} = await this.call(canisterId, {
      methodName,
      arg,
      // effectiveCanisterId optional but, actually mandatory.
      effectiveCanisterId: canisterId
    });
  };
}
