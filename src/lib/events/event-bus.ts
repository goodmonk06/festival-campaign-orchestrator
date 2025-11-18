/**
 * Event Bus
 *
 * In-memory event dispatcher for domain events.
 * Handlers can subscribe to specific event types and react accordingly.
 */

import { logger } from '../logger';
import type { DomainEvent, EventHandler, EventType } from './types';

class EventBus {
  private handlers: Map<EventType, EventHandler[]> = new Map();
  private globalHandlers: EventHandler[] = [];

  /**
   * Subscribe to a specific event type
   */
  on<T extends DomainEvent>(eventType: T['type'], handler: EventHandler<T>): () => void {
    const handlers = this.handlers.get(eventType) || [];
    handlers.push(handler as EventHandler);
    this.handlers.set(eventType, handlers);

    logger.debug('Event handler registered', { eventType, handlerCount: handlers.length });

    // Return unsubscribe function
    return () => {
      const currentHandlers = this.handlers.get(eventType) || [];
      const index = currentHandlers.indexOf(handler as EventHandler);
      if (index > -1) {
        currentHandlers.splice(index, 1);
        this.handlers.set(eventType, currentHandlers);
      }
    };
  }

  /**
   * Subscribe to all events
   */
  onAll(handler: EventHandler): () => void {
    this.globalHandlers.push(handler);

    logger.debug('Global event handler registered', { handlerCount: this.globalHandlers.length });

    // Return unsubscribe function
    return () => {
      const index = this.globalHandlers.indexOf(handler);
      if (index > -1) {
        this.globalHandlers.splice(index, 1);
      }
    };
  }

  /**
   * Emit an event to all registered handlers
   */
  async emit(event: DomainEvent): Promise<void> {
    logger.info('Event emitted', {
      type: event.type,
      timestamp: event.timestamp,
      correlationId: event.correlationId,
    });

    // Get specific handlers for this event type
    const typeHandlers = this.handlers.get(event.type) || [];
    const allHandlers = [...typeHandlers, ...this.globalHandlers];

    if (allHandlers.length === 0) {
      logger.debug('No handlers registered for event', { type: event.type });
      return;
    }

    // Execute all handlers in parallel
    const promises = allHandlers.map(async (handler) => {
      try {
        await handler(event);
        logger.debug('Event handler executed successfully', { type: event.type });
      } catch (error) {
        logger.error('Event handler failed', {
          type: event.type,
          error: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined,
        });
        // Don't throw - continue executing other handlers
      }
    });

    await Promise.allSettled(promises);
  }

  /**
   * Remove all handlers for a specific event type
   */
  clear(eventType?: EventType): void {
    if (eventType) {
      this.handlers.delete(eventType);
      logger.debug('Cleared handlers for event type', { eventType });
    } else {
      this.handlers.clear();
      this.globalHandlers = [];
      logger.debug('Cleared all event handlers');
    }
  }

  /**
   * Get count of handlers for an event type
   */
  getHandlerCount(eventType?: EventType): number {
    if (eventType) {
      return (this.handlers.get(eventType) || []).length;
    }
    let total = this.globalHandlers.length;
    this.handlers.forEach((handlers) => {
      total += handlers.length;
    });
    return total;
  }
}

// Singleton instance
export const eventBus = new EventBus();
