import {z} from 'zod';

export const OriginSchema = z.string().url();

export type Origin = z.infer<typeof OriginSchema>;
