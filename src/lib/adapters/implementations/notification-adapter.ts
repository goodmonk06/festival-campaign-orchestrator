/**
 * Notification Adapter Implementation
 *
 * Default implementation that calls the notification-hub service.
 * Can be swapped with other implementations (e.g., AWS SNS, SendGrid, etc.)
 */

import { logger } from '../../logger';
import { metrics, MetricNames } from '../../metrics';
import type {
  INotificationAdapter,
  SendNotificationParams,
  SendNotificationResult,
} from '../types';

export class NotificationHubAdapter implements INotificationAdapter {
  private endpoint: string;

  constructor(endpoint?: string) {
    this.endpoint = endpoint || process.env.NOTIFICATION_HUB_URL || 'http://localhost:3002';
  }

  async sendNotification(params: SendNotificationParams): Promise<SendNotificationResult> {
    const startTime = Date.now();

    try {
      logger.info('Sending notification', {
        recipientId: params.recipientId,
        type: params.type,
        endpoint: this.endpoint,
      });

      // Stub implementation - in production, make actual HTTP call
      // const response = await fetch(`${this.endpoint}/api/notifications/send`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(params),
      // });
      // const data = await response.json();

      // Mock response
      const result: SendNotificationResult = {
        success: true,
        notificationId: `notif-${Date.now()}`,
        sentAt: new Date(),
      };

      const duration = Date.now() - startTime;
      metrics.recordHistogram(MetricNames.INTEGRATION_DURATION, duration, {
        service: 'notification-hub',
        operation: 'send_notification',
      });

      metrics.incrementCounter(MetricNames.INTEGRATION_CALL, 1, {
        service: 'notification-hub',
        operation: 'send_notification',
        status: 'success',
      });

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      metrics.recordHistogram(MetricNames.INTEGRATION_DURATION, duration, {
        service: 'notification-hub',
        operation: 'send_notification',
        error: 'true',
      });

      metrics.incrementCounter(MetricNames.INTEGRATION_ERROR, 1, {
        service: 'notification-hub',
        operation: 'send_notification',
      });

      logger.error('Failed to send notification', {
        recipientId: params.recipientId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      return {
        success: false,
        notificationId: '',
        sentAt: new Date(),
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async sendBulkNotification(
    recipientIds: string[],
    params: Omit<SendNotificationParams, 'recipientId'>
  ): Promise<SendNotificationResult[]> {
    logger.info('Sending bulk notification', {
      recipientCount: recipientIds.length,
      type: params.type,
    });

    // For now, send individually - in production this would be optimized
    const results = await Promise.all(
      recipientIds.map((recipientId) =>
        this.sendNotification({ ...params, recipientId })
      )
    );

    return results;
  }

  async scheduleNotification(
    params: SendNotificationParams & { scheduledAt: Date }
  ): Promise<{ success: boolean; scheduledNotificationId: string }> {
    try {
      logger.info('Scheduling notification', {
        recipientId: params.recipientId,
        type: params.type,
        scheduledAt: params.scheduledAt,
      });

      // Stub implementation
      // const response = await fetch(`${this.endpoint}/api/notifications/schedule`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(params),
      // });

      metrics.incrementCounter(MetricNames.INTEGRATION_CALL, 1, {
        service: 'notification-hub',
        operation: 'schedule_notification',
        status: 'success',
      });

      return {
        success: true,
        scheduledNotificationId: `sched-notif-${Date.now()}`,
      };
    } catch (error) {
      metrics.incrementCounter(MetricNames.INTEGRATION_ERROR, 1, {
        service: 'notification-hub',
        operation: 'schedule_notification',
      });

      logger.error('Failed to schedule notification', {
        recipientId: params.recipientId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      throw error;
    }
  }
}

// Create default instance
export const notificationAdapter = new NotificationHubAdapter();
