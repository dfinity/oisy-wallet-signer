import {jsonReplacer, uint8ArrayToHexString} from '@dfinity/utils';
import {HexString} from 'src/types/hexString';

export const generateHash = async <T extends object>(params: T): Promise<HexString> => {
  const jsonString = JSON.stringify(params, jsonReplacer);
  const dataBuffer = new TextEncoder().encode(jsonString);
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);

  return uint8ArrayToHexString(new Uint8Array(hashBuffer));
};
