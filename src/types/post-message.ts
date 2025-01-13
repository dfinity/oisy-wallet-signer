import * as z from 'zod';
import {UrlSchema} from './url';

export const OriginSchema = UrlSchema;

export type Origin = z.infer<typeof OriginSchema>;
