import {UrlSchema} from '@dfinity/zod-schemas';
import type * as z from 'zod/v4';

export const OriginSchema = UrlSchema;

export type Origin = z.infer<typeof OriginSchema>;
