import { DiscoveryService } from '@nestjs/core';

export const OnRequest = DiscoveryService.createDecorator<{
  route: string;
  queue?: string;
}>();
export const OnPublish = DiscoveryService.createDecorator<{
  route: string;
  queue?: string;
}>();
export const Nats = DiscoveryService.createDecorator<{ name: string }>();
