/**
 * Achievement Service
 *
 * Manages achievement definitions and awards them to participants.
 */

import { prisma } from '../prisma';
import { logger } from '../logger';
import { eventBus } from '../events/event-bus';
import type { AchievementEarnedEvent, ParticipantProgress } from '../events/types';

export interface AchievementDefinition {
  key: string;
  type: 'track_completed' | 'campaign_completed' | 'streak' | 'perfect_score' | 'early_bird';
  title: string;
  description: string;
  badgeImageUrl?: string;
  checkCondition: (context: AchievementContext) => boolean;
}

export interface AchievementContext {
  campaignId: string;
  memberId: string;
  progress: ParticipantProgress;
  campaign?: any;
  participant?: any;
}

// Built-in achievement definitions
export const ACHIEVEMENT_DEFINITIONS: AchievementDefinition[] = [
  {
    key: 'first_track_completed',
    type: 'track_completed',
    title: '🎯 First Track Champion',
    description: 'Complete your first track in this campaign',
    checkCondition: (ctx) => {
      const completedTracks = ctx.progress.tracks.filter((track) =>
        track.actions.every((action) => action.completed)
      );
      return completedTracks.length === 1;
    },
  },
  {
    key: 'all_tracks_completed',
    type: 'campaign_completed',
    title: '🏆 Campaign Master',
    description: 'Complete all tracks in this campaign',
    checkCondition: (ctx) => {
      if (!ctx.campaign) return false;
      const totalTracks = ctx.campaign.tracks?.length || 0;
      const completedTracks = ctx.progress.tracks.filter((track) =>
        track.actions.every((action) => action.completed)
      );
      return totalTracks > 0 && completedTracks.length === totalTracks;
    },
  },
  {
    key: 'perfect_week',
    type: 'streak',
    title: '⭐ Perfect Week',
    description: 'Complete actions for 7 consecutive days',
    checkCondition: (ctx) => {
      // Simplified check - in production, would track daily completions
      return ctx.progress.totalActionsCompleted >= 7;
    },
  },
  {
    key: 'early_adopter',
    type: 'early_bird',
    title: '🚀 Early Adopter',
    description: 'Join the campaign within the first 24 hours',
    checkCondition: (ctx) => {
      if (!ctx.campaign || !ctx.participant) return false;
      const campaignStart = new Date(ctx.campaign.startAt);
      const joinTime = new Date(ctx.participant.joinedAt);
      const hoursDiff = (joinTime.getTime() - campaignStart.getTime()) / (1000 * 60 * 60);
      return hoursDiff <= 24;
    },
  },
  {
    key: 'halfway_hero',
    type: 'perfect_score',
    title: '🎖️ Halfway Hero',
    description: 'Complete 50% of all campaign actions',
    checkCondition: (ctx) => {
      if (!ctx.campaign) return false;
      const totalActions =
        ctx.campaign.tracks?.reduce(
          (sum: number, track: any) => sum + (track.actions?.length || 0),
          0
        ) || 0;
      return totalActions > 0 && ctx.progress.totalActionsCompleted >= totalActions / 2;
    },
  },
];

export class AchievementService {
  /**
   * Check and award any new achievements for a participant
   */
  async checkAndAwardAchievements(
    campaignId: string,
    memberId: string
  ): Promise<void> {
    try {
      logger.info('Checking achievements', { campaignId, memberId });

      // Get participant with progress
      const participant = await prisma.participantFestivalState.findUnique({
        where: {
          campaignId_memberId: {
            campaignId,
            memberId,
          },
        },
        include: {
          campaign: {
            include: {
              tracks: {
                include: {
                  actions: true,
                },
              },
            },
          },
        },
      });

      if (!participant) {
        logger.warn('Participant not found', { campaignId, memberId });
        return;
      }

      const progress: ParticipantProgress = JSON.parse(participant.progressJson);

      // Get already earned achievements
      const earnedAchievements = await prisma.memberAchievement.findMany({
        where: {
          campaignId,
          memberId,
        },
        select: {
          achievementKey: true,
        },
      });

      const earnedKeys = new Set(earnedAchievements.map((a) => a.achievementKey));

      // Check each achievement definition
      const context: AchievementContext = {
        campaignId,
        memberId,
        progress,
        campaign: participant.campaign,
        participant,
      };

      for (const definition of ACHIEVEMENT_DEFINITIONS) {
        // Skip if already earned
        if (earnedKeys.has(definition.key)) {
          continue;
        }

        // Check condition
        if (definition.checkCondition(context)) {
          await this.awardAchievement(campaignId, memberId, definition);
        }
      }
    } catch (error) {
      logger.error('Failed to check achievements', {
        campaignId,
        memberId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Award an achievement to a participant
   */
  private async awardAchievement(
    campaignId: string,
    memberId: string,
    definition: AchievementDefinition
  ): Promise<void> {
    try {
      logger.info('Awarding achievement', {
        campaignId,
        memberId,
        achievementKey: definition.key,
      });

      const achievement = await prisma.memberAchievement.create({
        data: {
          campaignId,
          memberId,
          achievementType: definition.type,
          achievementKey: definition.key,
          title: definition.title,
          description: definition.description,
          badgeImageUrl: definition.badgeImageUrl,
          dataJson: JSON.stringify({
            awardedAt: new Date().toISOString(),
          }),
        },
      });

      logger.info('Achievement awarded', {
        achievementId: achievement.id,
        campaignId,
        memberId,
        achievementKey: definition.key,
      });

      // Emit achievement earned event
      const event: AchievementEarnedEvent = {
        type: 'achievement.earned',
        timestamp: new Date(),
        data: {
          campaignId,
          memberId,
          achievementKey: definition.key,
          achievementType: definition.type,
          title: definition.title,
        },
      };

      await eventBus.emit(event);
    } catch (error) {
      // Ignore duplicate key errors (race condition)
      if (error instanceof Error && error.message.includes('Unique constraint')) {
        logger.debug('Achievement already exists (race condition)', {
          campaignId,
          memberId,
          achievementKey: definition.key,
        });
        return;
      }

      throw error;
    }
  }

  /**
   * Get all achievements for a member across all campaigns
   */
  async getMemberAchievements(memberId: string): Promise<any[]> {
    return prisma.memberAchievement.findMany({
      where: { memberId },
      include: {
        campaign: {
          select: {
            id: true,
            name: true,
            key: true,
          },
        },
      },
      orderBy: { earnedAt: 'desc' },
    });
  }

  /**
   * Get achievements for a specific campaign
   */
  async getCampaignAchievements(campaignId: string): Promise<any[]> {
    return prisma.memberAchievement.findMany({
      where: { campaignId },
      orderBy: { earnedAt: 'desc' },
    });
  }
}

// Singleton instance
export const achievementService = new AchievementService();
