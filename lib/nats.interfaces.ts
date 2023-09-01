import { ConnectionOptions } from 'nats';
export interface NatsOptions extends ConnectionOptions {
  /**
   * @default true
   */
  global?: boolean;
}
type RouteOpts = {
  queue?: string;
  max?: number;
  timeout?: number;
};
type off = IDispose;

export type IConnect = {
  on<T>(route: string, callback: IEvent<T>, options?: RouteOpts): off;
  emit<T>(route: string, data?: T): Promise<void>;

  reply<T, P>(route: string, callback: IReply<T, P>, options?: RouteOpts): off;
  request<T, P>(route: string, data?: T): Promise<P>;
};
export type IEvent<T> = (data: T, connect: IConnect) => void;
export type IReply<T, P> = (data: T, connect: IConnect) => Promise<P>;
export type IDispose = () => Promise<void>;
