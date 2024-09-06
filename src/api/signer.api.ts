import type {IcrcCallCanisterRequestParams} from '../types/icrc-requests';
import type {SignerOptions} from '../types/signer-options';
import {Icrc21Canister} from './icrc21-canister.api';

export class SignerApi extends Icrc21Canister {
  // TODO: return result
  async call({
    owner,
    host,
    params: {canisterId, method: methodName, arg}
  }: {
    params: IcrcCallCanisterRequestParams;
  } & SignerOptions): Promise<void> {
    const agent = await this.getAgent({host, owner});

    await agent.call(canisterId, {
      methodName,
      arg,
      effectiveCanisterId: canisterId
    });
  }
}
