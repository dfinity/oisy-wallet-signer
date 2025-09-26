import * as z from 'zod';

/**
 * In Zod v4, functions are no longer treated as standard Zod schemas (see: https://zod.dev/v4/changelog?id=zfunction).
 * Since this library uses functions as schemas, we need a workaround to parse them.
 * This utility provides that workaround, following the approach recommended
 * in the Zod migration guide:
 * https://github.com/colinhacks/zod/issues/4143#issuecomment-2845134912
 *
 * Note: The downside of this workaround is that using `safeParse` to validate a function schema
 * will throw an error instead of returning a success or failure result. However, since our implementation
 * exclusively uses `parse`, this utility is acceptable for our use case.
 */
export const createFunctionSchema = <T extends z.core.$ZodFunction>(schema: T) =>
  z.custom<Parameters<T['implement']>[0]>((fn) =>
    schema.implement(fn as Parameters<T['implement']>[0])
  );
