import {z} from 'zod';

export const UrlSchema = z
  .string()
  .url()
  .refine(
    (url): boolean => {
      try {
        const {protocol, hostname} = new URL(url);

        // We allow http for development locally
        if (['localhost', '127.0.0.1'].includes(hostname)) {
          return ['http:', 'https:'].includes(protocol);
        }

        return protocol === 'https:';
      } catch (_err: unknown) {
        return false;
      }
    },
    {
      message: 'Invalid URL.'
    }
  );
