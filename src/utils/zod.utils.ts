import * as z from 'zod/v4';

/**
 * In Zod v4, functions are no longer standard Zod schemas (see: https://zod.dev/v4/changelog?id=zfunction).
 * Since the library uses them as schemas, we need a workaround to parse them.
 * This utility provides that workaround and follows the approach recommended
 * in the Zod migration guide:
 * https://github.com/colinhacks/zod/issues/4143#issuecomment-2845134912
 */
export const createFunctionSchema = <T extends z.core.$ZodFunction>(schema: T) =>
  z.custom<Parameters<T['implement']>[0]>((fn) =>
    schema.implement(fn as Parameters<T['implement']>[0])
  );
