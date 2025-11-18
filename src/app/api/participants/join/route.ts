import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { joinCampaignSchema } from '@/lib/validations';
import { successResponse, errorResponse, handleApiError } from '@/lib/api-utils';

// POST /api/participants/join - Join a campaign
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { campaignId, memberId } = joinCampaignSchema.parse(body);

    // Check if campaign exists and is active
    const campaign = await prisma.festivalCampaign.findUnique({
      where: { id: campaignId },
    });

    if (!campaign) {
      return errorResponse('Campaign not found', 404);
    }

    const now = new Date();
    if (now < campaign.startAt || now > campaign.endAt) {
      return errorResponse('Campaign is not currently active', 400);
    }

    // Check if already joined
    const existing = await prisma.participantFestivalState.findUnique({
      where: {
        campaignId_memberId: {
          campaignId,
          memberId,
        },
      },
    });

    if (existing) {
      return errorResponse('Already joined this campaign', 400);
    }

    // Create participant state
    const participant = await prisma.participantFestivalState.create({
      data: {
        campaignId,
        memberId,
        progressJson: JSON.stringify({
          tracks: [],
          totalActionsCompleted: 0,
        }),
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

    return successResponse(participant, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
