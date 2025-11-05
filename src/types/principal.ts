import {Principal} from '@icp-sdk/core/principal';
import {z} from 'zod';

export const PrincipalObjSchema = z
  .strictObject({
    _isPrincipal: z.literal(true),
    _arr: z.instanceof(Uint8Array)
  })
  .transform((value) => Principal.from(value));
