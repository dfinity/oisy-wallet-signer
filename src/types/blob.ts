import {z} from 'zod';

export const IcrcBlobSchema = z.string().refine(
  (val) => {
    try {
      return btoa(atob(val)) === val;
    } catch (e) {
      return false;
    }
  },
  {
    message: 'Invalid base64 string'
  }
);
