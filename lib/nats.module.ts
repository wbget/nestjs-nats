import { DynamicModule, Module } from '@nestjs/common';
import { DiscoveryModule } from '@nestjs/core';
import { connect } from 'nats';
import { NatsOptions } from './nats.interfaces';
import { NatsLoader } from './nats.loader';
import { NatsClient } from './nats.service';

@Module({})
export class NatsModule {
  static forRoot(options?: NatsOptions): DynamicModule {
    return {
      global: options?.global ?? true,
      module: NatsModule,
      imports: [DiscoveryModule],
      providers: [
        {
          provide: NatsClient,
          useFactory: async () => {
            const nc = await connect(options);
            return new NatsClient(nc);
          },
        },
        NatsLoader,
      ],
      exports: [NatsLoader, NatsClient],
    };
  }
}
