import {z} from 'zod';
import {RpcIdSchema} from './rpc';

const MessageEventSourceSchema = z.union([
  z.instanceof(Window),
  z.instanceof(MessagePort),
  z.instanceof(ServiceWorker)
]);

const NotifySchema = z.object({
  id: RpcIdSchema,
  origin: z.string(),
  source: MessageEventSourceSchema
});

export type Notify = z.infer<typeof NotifySchema>;
