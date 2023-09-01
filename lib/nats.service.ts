import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { Empty, JSONCodec, NatsConnection } from 'nats';
import { IConnect, IDispose, IEvent, IReply } from './nats.interfaces';

const codec = JSONCodec();
const safeDecode = (data: Uint8Array) =>
  data.length === 0 ? 0 : codec.decode(data);

@Injectable()
export class NatsClient implements OnModuleDestroy, IConnect {
  private connect: NatsConnection;
  constructor(connect: NatsConnection) {
    this.connect = connect;
  }
  on<T>(
    route: string,
    callback: IEvent<T>,
    options?: { queue?: string; max?: number; timeout?: number },
  ) {
    const sub = this.connect.subscribe(route, options);
    (async () => {
      for await (const m of sub) {
        try {
          await callback.call(callback, safeDecode(m.data) as any, this);
        } catch (error) {
          return Promise.reject(error);
        }
      }
    })();
    return async () => {
      if (sub.isClosed()) return Promise.reject();
      await sub.drain();
    };
  }
  emit<T>(route: string, data?: T): Promise<void> {
    try {
      if (data) {
        this.connect.publish(route, codec.encode(data));
      } else {
        this.connect.publish(route, Empty);
      }
      return Promise.resolve();
    } catch (error) {
      return Promise.reject(error);
    }
  }
  reply<T, P>(
    route: string,
    callback: IReply<T, P>,
    options?: { queue?: string; max?: number; timeout?: number },
  ): IDispose {
    const sub = this.connect.subscribe(route, options);
    (async () => {
      for await (const m of sub) {
        try {
          const respond = await callback.call(
            callback,
            safeDecode(m.data) as any,
            this,
          );
          if (respond) {
            m.respond(codec.encode(respond));
          } else {
            m.respond(Empty);
          }
        } catch (error) {
          console.error(error);
        }
      }
    })();
    return async () => {
      if (sub.isClosed()) return Promise.reject();
      await sub.drain();
    };
  }
  async request<T, P>(route: string, data?: T): Promise<P> {
    try {
      if (data) {
        const res = await this.connect.request(route, codec.encode(data));
        return safeDecode(res.data) as P;
      } else {
        const res = await this.connect.request(route, Empty);
        return safeDecode(res.data) as P;
      }
    } catch (error) {
      console.error(error);
    }
  }
  async onModuleDestroy() {
    await this.connect?.drain();
    this.connect = null;
  }
}
