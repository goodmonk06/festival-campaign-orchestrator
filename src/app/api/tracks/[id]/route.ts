import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { updateTrackSchema } from '@/lib/validations';
import { successResponse, errorResponse, handleApiError } from '@/lib/api-utils';

// GET /api/tracks/:id - Get a specific track
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const track = await prisma.festivalTrack.findUnique({
      where: { id: params.id },
      include: {
        actions: {
          orderBy: { orderIndex: 'asc' },
        },
        campaign: true,
      },
    });

    if (!track) {
      return errorResponse('Track not found', 404);
    }

    return successResponse(track);
  } catch (error) {
    return handleApiError(error);
  }
}

// PATCH /api/tracks/:id - Update a track
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const data = updateTrackSchema.parse(body);

    const updateData: any = { ...data };
    if (data.metaJson) updateData.metaJson = JSON.stringify(data.metaJson);

    const track = await prisma.festivalTrack.update({
      where: { id: params.id },
      data: updateData,
      include: {
        actions: {
          orderBy: { orderIndex: 'asc' },
        },
      },
    });

    return successResponse(track);
  } catch (error) {
    return handleApiError(error);
  }
}

// DELETE /api/tracks/:id - Delete a track
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.festivalTrack.delete({
      where: { id: params.id },
    });

    return successResponse({ message: 'Track deleted successfully' });
  } catch (error) {
    return handleApiError(error);
  }
}
