import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createTrackSchema } from '@/lib/validations';
import { successResponse, handleApiError } from '@/lib/api-utils';

// POST /api/tracks - Create a new track
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = createTrackSchema.parse(body);

    const track = await prisma.festivalTrack.create({
      data: {
        ...data,
        metaJson: data.metaJson ? JSON.stringify(data.metaJson) : '{}',
      },
      include: {
        actions: {
          orderBy: { orderIndex: 'asc' },
        },
      },
    });

    return successResponse(track, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
