/**
 * Ritual Orchestrator Adapter Implementation
 */

import { logger } from '../../logger';
import { metrics, MetricNames } from '../../metrics';
import type {
  IRitualAdapter,
  ActivateRitualParams,
  ActivateRitualResult,
  RecordRitualCompletionParams,
  RitualStatsResult,
} from '../types';

export class RitualOrchestratorAdapter implements IRitualAdapter {
  private endpoint: string;

  constructor(endpoint?: string) {
    this.endpoint = endpoint || process.env.RITUAL_ORCHESTRATOR_URL || 'http://localhost:3003';
  }

  async activateRitual(params: ActivateRitualParams): Promise<ActivateRitualResult> {
    const startTime = Date.now();

    try {
      logger.info('Activating ritual', {
        ritualId: params.ritualId,
        memberId: params.memberId,
        frequency: params.frequency,
        campaignId: params.campaignId,
      });

      // Calculate next occurrence based on frequency
      const nextOccurrence = new Date(params.startDate);
      if (params.frequency === 'daily') {
        nextOccurrence.setDate(nextOccurrence.getDate() + 1);
      } else if (params.frequency === 'weekly') {
        nextOccurrence.setDate(nextOccurrence.getDate() + 7);
      }

      const result: ActivateRitualResult = {
        success: true,
        ritualScheduleId: `ritual-sched-${Date.now()}`,
        nextOccurrence,
      };

      const duration = Date.now() - startTime;
      metrics.recordHistogram(MetricNames.INTEGRATION_DURATION, duration, {
        service: 'ritual-orchestrator',
        operation: 'activate_ritual',
      });

      metrics.incrementCounter(MetricNames.INTEGRATION_CALL, 1, {
        service: 'ritual-orchestrator',
        operation: 'activate_ritual',
        status: 'success',
      });

      return result;
    } catch (error) {
      logger.error('Failed to activate ritual', {
        ritualId: params.ritualId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      return {
        success: false,
        ritualScheduleId: '',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async recordRitualCompletion(params: RecordRitualCompletionParams): Promise<{ success: boolean }> {
    logger.info('Recording ritual completion', {
      ritualScheduleId: params.ritualScheduleId,
      memberId: params.memberId,
    });

    metrics.incrementCounter(MetricNames.INTEGRATION_CALL, 1, {
      service: 'ritual-orchestrator',
      operation: 'record_completion',
      status: 'success',
    });

    return { success: true };
  }

  async deactivateRitual(ritualScheduleId: string): Promise<void> {
    logger.info('Deactivating ritual', { ritualScheduleId });
  }

  async getRitualStats(ritualScheduleId: string): Promise<RitualStatsResult> {
    logger.info('Getting ritual stats', { ritualScheduleId });

    // Mock stats
    return {
      totalCompletions: Math.floor(Math.random() * 20),
      currentStreak: Math.floor(Math.random() * 10),
      longestStreak: Math.floor(Math.random() * 15),
    };
  }
}

export const ritualAdapter = new RitualOrchestratorAdapter();
