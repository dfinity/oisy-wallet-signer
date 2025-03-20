import {uint8ArrayToHexString} from '@dfinity/utils';

export async function generateHash(params: Record<string, string>): Promise<string> {
  const sortedKeys = Object.keys(params).sort();
  const jsonString = JSON.stringify(params, sortedKeys);
  const dataBuffer = new TextEncoder().encode(jsonString);
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);

  return uint8ArrayToHexString(new Uint8Array(hashBuffer));
}
