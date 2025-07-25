import {Principal} from '@dfinity/principal';
import * as z from 'zod/v4';

// TODO: to be moved to zod-schemas
export const PrincipalSchema = z.custom<Principal>().refine(
  (value) => {
    try {
      Principal.from(value);
      return true;
    } catch (_err: unknown) {
      return false;
    }
  },
  {
    error: 'Invalid Principal.'
  }
);
