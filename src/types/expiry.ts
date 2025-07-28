import {z} from 'zod/v4';
import {bigIntToExpiry} from '../utils/expiry.utils';

export const ExpiryObjSchema = z
  .strictObject({
    _isExpiry: z.literal(true),
    __expiry__: z.bigint()
  })
  .transform((value) => bigIntToExpiry(value.__expiry__));
