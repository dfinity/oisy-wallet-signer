import * as z from 'zod';
import {RpcIdSchema} from './rpc';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const NotifySchema = z.object({
  id: RpcIdSchema,
  origin: z.string()
});

export type Notify = z.infer<typeof NotifySchema>;
