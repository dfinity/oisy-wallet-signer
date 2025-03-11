import { IcrcCallCanisterRequestParams } from 'src/types/icrc-requests';

export async function generateHash(params: IcrcCallCanisterRequestParams): Promise<string> {
    const jsonString = JSON.stringify(params, Object.keys(params).sort());

    const dataBuffer = new TextEncoder().encode(jsonString);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);

    return bufferToHex(hashBuffer);
}

function bufferToHex(buffer: ArrayBuffer): string {
    return [...new Uint8Array(buffer)]
      .map(byte => byte.toString(16).padStart(2, '0'))
      .join('');
  }
