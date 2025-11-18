import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { updateProgressSchema } from '@/lib/validations';
import { successResponse, errorResponse, handleApiError } from '@/lib/api-utils';
import type { ParticipantProgress, ActionProgress } from '@/types/festival';

// POST /api/participants/progress - Update participant progress
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { campaignId, memberId, actionId, completed, data } = updateProgressSchema.parse(body);

    // Find participant state
    const participant = await prisma.participantFestivalState.findUnique({
      where: {
        campaignId_memberId: {
          campaignId,
          memberId,
        },
      },
    });

    if (!participant) {
      return errorResponse('Participant not found. Please join the campaign first.', 404);
    }

    // Verify action exists and belongs to the campaign
    const action = await prisma.festivalAction.findUnique({
      where: { id: actionId },
      include: {
        track: true,
      },
    });

    if (!action || action.track.campaignId !== campaignId) {
      return errorResponse('Invalid action for this campaign', 400);
    }

    // Parse and update progress
    const currentProgress: ParticipantProgress = JSON.parse(participant.progressJson);

    // Find or create track progress
    let trackProgress = currentProgress.tracks.find((t) => t.trackId === action.trackId);
    if (!trackProgress) {
      trackProgress = { trackId: action.trackId, actions: [] };
      currentProgress.tracks.push(trackProgress);
    }

    // Find or create action progress
    let actionProgress = trackProgress.actions.find((a) => a.actionId === actionId);
    if (!actionProgress) {
      actionProgress = { actionId, completed: false };
      trackProgress.actions.push(actionProgress);
    }

    // Update action completion
    const wasCompleted = actionProgress.completed;
    actionProgress.completed = completed;
    actionProgress.completedAt = completed ? new Date().toISOString() : undefined;
    if (data) {
      actionProgress.data = data;
    }

    // Update total count
    if (completed && !wasCompleted) {
      currentProgress.totalActionsCompleted = (currentProgress.totalActionsCompleted || 0) + 1;
    } else if (!completed && wasCompleted) {
      currentProgress.totalActionsCompleted = Math.max(
        0,
        (currentProgress.totalActionsCompleted || 0) - 1
      );
    }

    currentProgress.lastActivityAt = new Date().toISOString();

    // Save updated progress
    const updated = await prisma.participantFestivalState.update({
      where: { id: participant.id },
      data: {
        progressJson: JSON.stringify(currentProgress),
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

    return successResponse(updated);
  } catch (error) {
    return handleApiError(error);
  }
}

// GET /api/participants/progress?campaignId=X&memberId=Y - Get participant progress
export async function GET(request: NextRequest) {
  try {
    const campaignId = request.nextUrl.searchParams.get('campaignId');
    const memberId = request.nextUrl.searchParams.get('memberId');

    if (!campaignId || !memberId) {
      return errorResponse('campaignId and memberId are required', 400);
    }

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
                actions: {
                  orderBy: { orderIndex: 'asc' },
                },
              },
            },
          },
        },
      },
    });

    if (!participant) {
      return errorResponse('Participant not found', 404);
    }

    return successResponse(participant);
  } catch (error) {
    return handleApiError(error);
  }
}
