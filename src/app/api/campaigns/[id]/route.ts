import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { updateCampaignSchema } from '@/lib/validations';
import { successResponse, errorResponse, handleApiError } from '@/lib/api-utils';

// GET /api/campaigns/:id - Get a specific campaign
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const campaign = await prisma.festivalCampaign.findUnique({
      where: { id: params.id },
      include: {
        tracks: {
          include: {
            actions: {
              orderBy: { orderIndex: 'asc' },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
        _count: {
          select: { participants: true },
        },
      },
    });

    if (!campaign) {
      return errorResponse('Campaign not found', 404);
    }

    return successResponse(campaign);
  } catch (error) {
    return handleApiError(error);
  }
}

// PATCH /api/campaigns/:id - Update a campaign
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const data = updateCampaignSchema.parse(body);

    const updateData: any = { ...data };
    if (data.startAt) updateData.startAt = new Date(data.startAt);
    if (data.endAt) updateData.endAt = new Date(data.endAt);
    if (data.themeTagsJson) updateData.themeTagsJson = JSON.stringify(data.themeTagsJson);

    const campaign = await prisma.festivalCampaign.update({
      where: { id: params.id },
      data: updateData,
      include: {
        tracks: true,
      },
    });

    return successResponse(campaign);
  } catch (error) {
    return handleApiError(error);
  }
}

// DELETE /api/campaigns/:id - Delete a campaign
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.festivalCampaign.delete({
      where: { id: params.id },
    });

    return successResponse({ message: 'Campaign deleted successfully' });
  } catch (error) {
    return handleApiError(error);
  }
}
