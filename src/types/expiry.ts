import {z} from 'zod';
import {bigIntToExpiry} from '../utils/expiry.utils';

export const ExpiryObjSchema = z
  .strictObject({
    _isExpiry: z.literal(true),
    __expiry__: z.bigint()
  })
  .transform(({__expiry__}) => bigIntToExpiry(__expiry__));
