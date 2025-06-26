import * as z from 'zod/v4';

export const IcrcBlobSchema = z.string().refine(
  (val) => {
    try {
      return btoa(atob(val)) === val;
    } catch (_err: unknown) {
      return false;
    }
  },
  {
    message: 'Invalid base64 string'
  }
);

export type IcrcBlob = z.infer<typeof IcrcBlobSchema>;
