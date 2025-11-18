import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { successResponse, handleApiError } from '@/lib/api-utils';
import { logger } from '@/lib/logger';

const querySchema = z.object({
  campaignId: z.string().optional(),
  memberId: z.string().optional(),
  achievementType: z.string().optional(),
  limit: z.string().regex(/^\d+$/).optional(),
  offset: z.string().regex(/^\d+$/).optional(),
});

// GET /api/achievements - List achievements
export async function GET(request: NextRequest) {
  try {
    const searchParams = Object.fromEntries(request.nextUrl.searchParams.entries());
    const params = querySchema.parse(searchParams);

    const where: any = {};

    if (params.campaignId) {
      where.campaignId = params.campaignId;
    }

    if (params.memberId) {
      where.memberId = params.memberId;
    }

    if (params.achievementType) {
      where.achievementType = params.achievementType;
    }

    const limit = params.limit ? parseInt(params.limit) : 50;
    const offset = params.offset ? parseInt(params.offset) : 0;

    const achievements = await prisma.memberAchievement.findMany({
      where,
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
      take: limit,
      skip: offset,
    });

    const total = await prisma.memberAchievement.count({ where });

    return successResponse({
      achievements,
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
