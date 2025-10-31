import { Controller, Get } from '@nestjs/common';
import { MetricsService, MetricsSnapshot } from './metrics.service';

@Controller('metrics')
export class MetricsController {
  constructor(private readonly metrics: MetricsService) {}

  @Get()
  get(): { service: string; data: MetricsSnapshot } {
    return {
      service: 'notifications-service',
      data: this.metrics.snapshot(),
    };
  }
}
