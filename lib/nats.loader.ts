import { Injectable, Logger } from '@nestjs/common';
import { DiscoveryService, MetadataScanner } from '@nestjs/core';
import { Nats, OnPublish, OnRequest } from './nats.decorator';
import { NatsClient } from './nats.service';

@Injectable()
export class NatsLoader {
  logger = new Logger('Nats');
  constructor(
    private readonly discoveryService: DiscoveryService,
    private readonly metadataScanner: MetadataScanner,
    private readonly natsClient: NatsClient,
  ) {}

  async loadNats() {
    const nats = this.discoveryService.getProviders({
      metadataKey: Nats.KEY,
    });
    nats
      .filter((wrapper) => wrapper.isDependencyTreeStatic() && wrapper.instance)
      .forEach((wrapper) => {
        const { name } = this.discoveryService.getMetadataByDecorator(
          Nats,
          wrapper,
        );
        return {
          name,
          handlers: this.metadataScanner
            .getAllMethodNames(wrapper.metatype.prototype)
            .forEach((methodName) => {
              const request = this.discoveryService.getMetadataByDecorator(
                OnRequest,
                wrapper,
                methodName,
              );
              if (request) {
                const { route, queue } = request;
                this.natsClient.reply(
                  route,
                  wrapper.instance[methodName].bind(wrapper.instance),
                  {
                    queue,
                  },
                );
                this.logger.log(`${name}.${methodName} Reply [${route}]`);
              } else {
                const publish = this.discoveryService.getMetadataByDecorator(
                  OnPublish,
                  wrapper,
                  methodName,
                );
                if (publish) {
                  const { route, queue } = publish;
                  this.natsClient.on(
                    route,
                    wrapper.instance[methodName].bind(wrapper.instance),
                    {
                      queue,
                    },
                  );
                  this.logger.log(`${name}.${methodName} On [${route}]`);
                }
              }
            }),
        };
      });
  }
}
