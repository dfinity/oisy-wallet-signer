import {defaultStrategy, pollForResponse} from '@dfinity/agent/lib/cjs/polling';
import {Principal} from '@dfinity/principal';
import type {IcrcCallCanisterRequestParams} from '../types/icrc-requests';
import type {SignerOptions} from '../types/signer-options';
import {Icrc21Canister} from './icrc21-canister.api';

export class SignerApi extends Icrc21Canister {
  async call({
    owner,
    host,
    params: {canisterId, method: methodName, arg}
  }: {
    params: IcrcCallCanisterRequestParams;
  } & SignerOptions): Promise<void> {
    const agent = await this.getAgent({host, owner});

    const {
      requestId,
      response: callResponse,
      requestDetails
    } = await agent.call(canisterId, {
      methodName,
      arg,
      effectiveCanisterId: canisterId
    });

    // TODO: return result
    console.log('RESULT:', requestId, callResponse, requestDetails);

    if (callResponse.status === 202) {
      const response = await pollForResponse(
        agent,
        Principal.fromText(canisterId),
        requestId,
          defaultStrategy(),
      );

      response.certificate

      console.log('RESPONSE:', response);
    }
  }
}
