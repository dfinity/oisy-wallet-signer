import {z} from 'zod';

export const HexStringSchema = z.string().regex(/^[0-9a-f]+$/i);
export type HexString = z.infer<typeof HexStringSchema>;