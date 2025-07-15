import {UrlSchema} from '@dfinity/zod-schemas';
import type * as z from 'zod';

export const OriginSchema = UrlSchema;

export type Origin = z.infer<typeof OriginSchema>;
