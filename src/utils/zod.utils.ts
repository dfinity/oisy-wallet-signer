import * as z from 'zod/v4';

export const createFunctionSchema = <T extends z.core.$ZodFunction>(schema: T) =>
  z.custom<Parameters<T['implement']>[0]>((fn) =>
    schema.implement(fn as Parameters<T['implement']>[0])
  );
