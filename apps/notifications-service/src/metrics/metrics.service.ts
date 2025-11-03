import { Injectable } from '@nestjs/common';

export interface MetricsSnapshot {
  receivedByRoutingKey: Record<string, number>;
  processedByType: Record<string, number>;
  failedByType: Record<string, number>;
  timestamp: string;
}

@Injectable()
export class MetricsService {
  private readonly receivedByRoutingKey = new Map<string, number>();
  private readonly processedByType = new Map<string, number>();
  private readonly failedByType = new Map<string, number>();

  incrementReceived(routingKey: string): void {
    this.receivedByRoutingKey.set(routingKey, (this.receivedByRoutingKey.get(routingKey) ?? 0) + 1);
  }

  incrementProcessed(type: string): void {
    this.processedByType.set(type, (this.processedByType.get(type) ?? 0) + 1);
  }

  incrementFailed(type: string): void {
    this.failedByType.set(type, (this.failedByType.get(type) ?? 0) + 1);
  }

  snapshot(): MetricsSnapshot {
    return {
      receivedByRoutingKey: Object.fromEntries(this.receivedByRoutingKey.entries()),
      processedByType: Object.fromEntries(this.processedByType.entries()),
      failedByType: Object.fromEntries(this.failedByType.entries()),
      timestamp: new Date().toISOString(),
    };
  }
}
