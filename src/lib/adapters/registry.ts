/**
 * Adapter Registry
 *
 * Central registry for managing adapter implementations.
 * Allows runtime swapping of adapter implementations for testing or multi-tenant scenarios.
 */

import { logger } from '../logger';
import type {
  INotificationAdapter,
  IContentAdapter,
  IRitualAdapter,
  IMetricsAdapter,
  IAnalyticsAdapter,
  IStorageAdapter,
  IProfileAdapter,
} from './types';

type AdapterType =
  | 'notification'
  | 'content'
  | 'ritual'
  | 'metrics'
  | 'analytics'
  | 'storage'
  | 'profile';

type AdapterInstance =
  | INotificationAdapter
  | IContentAdapter
  | IRitualAdapter
  | IMetricsAdapter
  | IAnalyticsAdapter
  | IStorageAdapter
  | IProfileAdapter;

class AdapterRegistry {
  private adapters: Map<AdapterType, AdapterInstance> = new Map();

  /**
   * Register an adapter implementation
   */
  register<T extends AdapterInstance>(type: AdapterType, adapter: T): void {
    this.adapters.set(type, adapter);
    logger.info('Adapter registered', { type, adapterName: adapter.constructor.name });
  }

  /**
   * Get an adapter by type
   */
  get<T extends AdapterInstance>(type: AdapterType): T | null {
    const adapter = this.adapters.get(type);
    if (!adapter) {
      logger.warn('Adapter not found', { type });
      return null;
    }
    return adapter as T;
  }

  /**
   * Check if an adapter is registered
   */
  has(type: AdapterType): boolean {
    return this.adapters.has(type);
  }

  /**
   * Unregister an adapter
   */
  unregister(type: AdapterType): void {
    if (this.adapters.delete(type)) {
      logger.info('Adapter unregistered', { type });
    }
  }

  /**
   * Clear all adapters
   */
  clear(): void {
    this.adapters.clear();
    logger.info('All adapters cleared');
  }

  /**
   * Get all registered adapter types
   */
  getRegisteredTypes(): AdapterType[] {
    return Array.from(this.adapters.keys());
  }
}

// Singleton instance
export const adapterRegistry = new AdapterRegistry();

// Helper functions for common usage
export function getNotificationAdapter(): INotificationAdapter | null {
  return adapterRegistry.get<INotificationAdapter>('notification');
}

export function getContentAdapter(): IContentAdapter | null {
  return adapterRegistry.get<IContentAdapter>('content');
}

export function getRitualAdapter(): IRitualAdapter | null {
  return adapterRegistry.get<IRitualAdapter>('ritual');
}

export function getMetricsAdapter(): IMetricsAdapter | null {
  return adapterRegistry.get<IMetricsAdapter>('metrics');
}

export function getAnalyticsAdapter(): IAnalyticsAdapter | null {
  return adapterRegistry.get<IAnalyticsAdapter>('analytics');
}

export function getStorageAdapter(): IStorageAdapter | null {
  return adapterRegistry.get<IStorageAdapter>('storage');
}

export function getProfileAdapter(): IProfileAdapter | null {
  return adapterRegistry.get<IProfileAdapter>('profile');
}
