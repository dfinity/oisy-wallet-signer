import type {RpcId} from './rpc';

export interface Notify {
  id: RpcId;
  origin: string;
}
