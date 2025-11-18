import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { successResponse, errorResponse, handleApiError } from '@/lib/api-utils';
import { logger } from '@/lib/logger';

// GET /api/analytics/campaign/:campaignId - Get campaign analytics
export async function GET(
  request: NextRequest,
  { params }: { params: { campaignId: string } }
) {
  try {
    // Get or create analytics record
    let analytics = await prisma.campaignAnalytics.findUnique({
      where: { campaignId: params.campaignId },
      include: {
        campaign: {
          select: {
            id: true,
            name: true,
            startAt: true,
            endAt: true,
            status: true,
          },
        },
      },
    });

    if (!analytics) {
      // Create analytics if it doesn't exist
      analytics = await prisma.campaignAnalytics.create({
        data: {
          campaignId: params.campaignId,
        },
        include: {
          campaign: {
            select: {
              id: true,
              name: true,
              startAt: true,
              endAt: true,
              status: true,
            },
          },
        },
      });
    }

    return successResponse(analytics);
  } catch (error) {
    return handleApiError(error);
  }
}

// POST /api/analytics/campaign/:campaignId - Recalculate campaign analytics
export async function POST(
  request: NextRequest,
  { params }: { params: { campaignId: string } }
) {
  try {
    logger.info('Recalculating campaign analytics', { campaignId: params.campaignId });

    // Get campaign with participants and tracks
    const campaign = await prisma.festivalCampaign.findUnique({
      where: { id: params.campaignId },
      include: {
        participants: true,
        tracks: {
          include: {
            actions: true,
          },
        },
      },
    });

    if (!campaign) {
      return errorResponse('Campaign not found', 404);
    }

    // Calculate metrics
    const totalParticipants = campaign.participants.length;
    const activeParticipants = campaign.participants.filter((p) => p.status === 'active').length;
    const completedParticipants = campaign.participants.filter(
      (p) => p.status === 'completed'
    ).length;
    const droppedParticipants = campaign.participants.filter((p) => p.status === 'dropped').length;

    const totalActions = campaign.tracks.reduce((sum, track) => sum + track.actions.length, 0);

    // Calculate completed actions from participant progress
    let completedActionsCount = 0;
    for (const participant of campaign.participants) {
      const progress = JSON.parse(participant.progressJson);
      completedActionsCount += progress.totalActionsCompleted || 0;
    }

    const averageCompletion =
      totalParticipants > 0 && totalActions > 0
        ? completedActionsCount / (totalParticipants * totalActions)
        : 0;

    // Calculate engagement score (simple formula: weighted average of participation and completion)
    const participationRate = totalParticipants > 0 ? activeParticipants / totalParticipants : 0;
    const engagementScore = (participationRate * 0.4 + averageCompletion * 0.6) * 100;

    // Update or create analytics
    const analytics = await prisma.campaignAnalytics.upsert({
      where: { campaignId: params.campaignId },
      update: {
        totalParticipants,
        activeParticipants,
        completedParticipants,
        droppedParticipants,
        totalActions,
        completedActions: completedActionsCount,
        averageCompletion,
        engagementScore,
        lastCalculatedAt: new Date(),
      },
      create: {
        campaignId: params.campaignId,
        totalParticipants,
        activeParticipants,
        completedParticipants,
        droppedParticipants,
        totalActions,
        completedActions: completedActionsCount,
        averageCompletion,
        engagementScore,
        lastCalculatedAt: new Date(),
      },
    });

    logger.info('Campaign analytics recalculated', {
      campaignId: params.campaignId,
      totalParticipants,
      engagementScore,
    });

    return successResponse(analytics);
  } catch (error) {
    logger.error('Failed to recalculate analytics', {
      campaignId: params.campaignId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return handleApiError(error);
  }
}
