import * as z from 'zod';
import {RpcIdSchema} from './rpc';

const NotifySchema = z.object({
  id: RpcIdSchema,
  origin: z.string()
});

export type Notify = z.infer<typeof NotifySchema>;
