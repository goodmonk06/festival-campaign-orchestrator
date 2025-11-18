/**
 * Metrics Collection
 *
 * Simple metrics abstraction for tracking application performance and usage.
 * In production, this would integrate with Prometheus, Datadog, CloudWatch, etc.
 */

import { logger } from './logger';

interface MetricLabels {
  [key: string]: string | number;
}

interface CounterMetric {
  name: string;
  value: number;
  labels?: MetricLabels;
  timestamp: Date;
}

interface GaugeMetric {
  name: string;
  value: number;
  labels?: MetricLabels;
  timestamp: Date;
}

interface HistogramMetric {
  name: string;
  value: number;
  labels?: MetricLabels;
  timestamp: Date;
}

class Metrics {
  private counters: Map<string, number> = new Map();
  private gauges: Map<string, number> = new Map();
  private histograms: Map<string, number[]> = new Map();

  /**
   * Increment a counter metric
   */
  incrementCounter(name: string, value: number = 1, labels?: MetricLabels): void {
    const key = this.buildKey(name, labels);
    const current = this.counters.get(key) || 0;
    this.counters.set(key, current + value);

    logger.debug('Counter incremented', { name, value, labels, total: current + value });
  }

  /**
   * Set a gauge metric (current value)
   */
  setGauge(name: string, value: number, labels?: MetricLabels): void {
    const key = this.buildKey(name, labels);
    this.gauges.set(key, value);

    logger.debug('Gauge set', { name, value, labels });
  }

  /**
   * Record a histogram value (for timing, sizes, etc.)
   */
  recordHistogram(name: string, value: number, labels?: MetricLabels): void {
    const key = this.buildKey(name, labels);
    const values = this.histograms.get(key) || [];
    values.push(value);
    this.histograms.set(key, values);

    logger.debug('Histogram recorded', { name, value, labels });
  }

  /**
   * Time an async operation and record to histogram
   */
  async time<T>(name: string, fn: () => Promise<T>, labels?: MetricLabels): Promise<T> {
    const start = Date.now();
    try {
      const result = await fn();
      const duration = Date.now() - start;
      this.recordHistogram(`${name}_duration_ms`, duration, labels);
      return result;
    } catch (error) {
      const duration = Date.now() - start;
      this.recordHistogram(`${name}_duration_ms`, duration, { ...labels, error: 'true' });
      throw error;
    }
  }

  /**
   * Get counter value
   */
  getCounter(name: string, labels?: MetricLabels): number {
    const key = this.buildKey(name, labels);
    return this.counters.get(key) || 0;
  }

  /**
   * Get gauge value
   */
  getGauge(name: string, labels?: MetricLabels): number {
    const key = this.buildKey(name, labels);
    return this.gauges.get(key) || 0;
  }

  /**
   * Get histogram statistics
   */
  getHistogramStats(name: string, labels?: MetricLabels): {
    count: number;
    sum: number;
    avg: number;
    min: number;
    max: number;
    p50: number;
    p95: number;
    p99: number;
  } | null {
    const key = this.buildKey(name, labels);
    const values = this.histograms.get(key);

    if (!values || values.length === 0) {
      return null;
    }

    const sorted = [...values].sort((a, b) => a - b);
    const sum = sorted.reduce((acc, val) => acc + val, 0);

    return {
      count: sorted.length,
      sum,
      avg: sum / sorted.length,
      min: sorted[0],
      max: sorted[sorted.length - 1],
      p50: this.percentile(sorted, 50),
      p95: this.percentile(sorted, 95),
      p99: this.percentile(sorted, 99),
    };
  }

  /**
   * Get all metrics as a snapshot
   */
  snapshot(): {
    counters: Record<string, number>;
    gauges: Record<string, number>;
    histograms: Record<string, ReturnType<typeof this.getHistogramStats>>;
  } {
    const counters: Record<string, number> = {};
    const gauges: Record<string, number> = {};
    const histograms: Record<string, ReturnType<typeof this.getHistogramStats>> = {};

    this.counters.forEach((value, key) => {
      counters[key] = value;
    });

    this.gauges.forEach((value, key) => {
      gauges[key] = value;
    });

    this.histograms.forEach((_, key) => {
      const [name] = key.split('|');
      histograms[key] = this.getHistogramStats(name);
    });

    return { counters, gauges, histograms };
  }

  /**
   * Reset all metrics
   */
  reset(): void {
    this.counters.clear();
    this.gauges.clear();
    this.histograms.clear();
    logger.info('Metrics reset');
  }

  private buildKey(name: string, labels?: MetricLabels): string {
    if (!labels) return name;

    const labelStr = Object.entries(labels)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}:${value}`)
      .join(',');

    return `${name}|${labelStr}`;
  }

  private percentile(sorted: number[], p: number): number {
    const index = Math.ceil((sorted.length * p) / 100) - 1;
    return sorted[Math.max(0, index)];
  }
}

// Singleton instance
export const metrics = new Metrics();

// Common metric names for consistency
export const MetricNames = {
  // API metrics
  API_REQUEST: 'api_request_total',
  API_REQUEST_DURATION: 'api_request_duration_ms',
  API_ERROR: 'api_error_total',

  // Campaign metrics
  CAMPAIGN_CREATED: 'campaign_created_total',
  CAMPAIGN_ACTIVE: 'campaign_active',
  PARTICIPANT_JOINED: 'participant_joined_total',
  PARTICIPANT_ACTIVE: 'participant_active',
  ACTION_COMPLETED: 'action_completed_total',

  // Integration metrics
  INTEGRATION_CALL: 'integration_call_total',
  INTEGRATION_DURATION: 'integration_duration_ms',
  INTEGRATION_ERROR: 'integration_error_total',

  // Event metrics
  EVENT_EMITTED: 'event_emitted_total',
  EVENT_HANDLER_DURATION: 'event_handler_duration_ms',

  // Webhook metrics
  WEBHOOK_DELIVERED: 'webhook_delivered_total',
  WEBHOOK_FAILED: 'webhook_failed_total',
} as const;
