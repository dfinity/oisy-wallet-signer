import * as z from 'zod/v4';

export const HexStringSchema = z.string().regex(/^[0-9a-f]+$/i);
export type HexString = z.infer<typeof HexStringSchema>;
