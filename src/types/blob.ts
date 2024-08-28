import {z} from 'zod';

export const IcrcBlob = z.instanceof(Uint8Array);
