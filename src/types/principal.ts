import {Principal} from '@dfinity/principal';
import {z} from 'zod/v4';

export const PrincipalObjSchema = z
  .strictObject({
    _isPrincipal: z.literal(true),
    _arr: z.instanceof(Uint8Array)
  })
  .transform((value) => Principal.from(value));
