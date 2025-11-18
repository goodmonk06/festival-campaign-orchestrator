import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createCampaignSchema, queryParamsSchema } from '@/lib/validations';
import { successResponse, errorResponse, handleApiError } from '@/lib/api-utils';

// GET /api/campaigns - List campaigns with filters
export async function GET(request: NextRequest) {
  try {
    const searchParams = Object.fromEntries(request.nextUrl.searchParams.entries());
    const params = queryParamsSchema.parse(searchParams);

    const where: any = {};

    if (params.communityId) {
      where.communityId = params.communityId;
    }

    if (params.active === 'true') {
      const now = new Date();
      where.startAt = { lte: now };
      where.endAt = { gte: now };
    }

    const limit = params.limit ? parseInt(params.limit) : 50;
    const offset = params.offset ? parseInt(params.offset) : 0;

    const campaigns = await prisma.festivalCampaign.findMany({
      where,
      include: {
        tracks: {
          include: {
            actions: {
              orderBy: { orderIndex: 'asc' },
            },
          },
        },
        _count: {
          select: { participants: true },
        },
      },
      orderBy: { startAt: 'desc' },
      take: limit,
      skip: offset,
    });

    const total = await prisma.festivalCampaign.count({ where });

    return successResponse({
      campaigns,
      pagination: {
        total,
        limit,
        offset,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// POST /api/campaigns - Create a new campaign
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = createCampaignSchema.parse(body);

    const campaign = await prisma.festivalCampaign.create({
      data: {
        ...data,
        startAt: new Date(data.startAt),
        endAt: new Date(data.endAt),
        themeTagsJson: data.themeTagsJson ? JSON.stringify(data.themeTagsJson) : '[]',
      },
      include: {
        tracks: true,
      },
    });

    return successResponse(campaign, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
