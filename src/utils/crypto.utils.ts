import {uint8ArrayToHexString} from '@dfinity/utils';
import {IcrcCallCanisterRequestParams} from 'src/types/icrc-requests';

export async function generateHash(params: IcrcCallCanisterRequestParams): Promise<string> {
  const jsonString = JSON.stringify(params, Object.keys(params).sort());

  const dataBuffer = new TextEncoder().encode(jsonString);
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);

  return uint8ArrayToHexString(new Uint8Array(hashBuffer));
}
