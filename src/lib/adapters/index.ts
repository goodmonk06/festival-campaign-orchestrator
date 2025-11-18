/**
 * Adapters Module
 *
 * Exports all adapter types, registry, and implementations.
 */

export * from './types';
export * from './registry';
export * from './implementations/notification-adapter';
export * from './implementations/content-adapter';
export * from './implementations/ritual-adapter';

// Initialize default adapters
import { adapterRegistry } from './registry';
import { notificationAdapter } from './implementations/notification-adapter';
import { contentAdapter } from './implementations/content-adapter';
import { ritualAdapter } from './implementations/ritual-adapter';

// Register default adapters on module load
export function initializeDefaultAdapters(): void {
  adapterRegistry.register('notification', notificationAdapter);
  adapterRegistry.register('content', contentAdapter);
  adapterRegistry.register('ritual', ritualAdapter);
}

// Auto-initialize in non-test environments
if (process.env.NODE_ENV !== 'test') {
  initializeDefaultAdapters();
}
