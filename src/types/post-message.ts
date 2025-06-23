import {UrlSchema} from '@dfinity/zod-schemas';
import type {ZodURL} from 'zod/v4';

export const OriginSchema = UrlSchema;

export type Origin = ZodURL;
