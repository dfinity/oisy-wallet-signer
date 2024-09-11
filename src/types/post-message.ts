import {z} from 'zod';

const OriginSchema = z.string().url();

export type Origin = z.infer<typeof OriginSchema>;
