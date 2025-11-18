import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { updateActionSchema } from '@/lib/validations';
import { successResponse, errorResponse, handleApiError } from '@/lib/api-utils';

// GET /api/actions/:id - Get a specific action
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const action = await prisma.festivalAction.findUnique({
      where: { id: params.id },
      include: {
        track: {
          include: {
            campaign: true,
          },
        },
      },
    });

    if (!action) {
      return errorResponse('Action not found', 404);
    }

    return successResponse(action);
  } catch (error) {
    return handleApiError(error);
  }
}

// PATCH /api/actions/:id - Update an action
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const data = updateActionSchema.parse(body);

    const updateData: any = { ...data };
    if (data.externalRefJson) updateData.externalRefJson = JSON.stringify(data.externalRefJson);
    if (data.scheduledAt) updateData.scheduledAt = new Date(data.scheduledAt);

    const action = await prisma.festivalAction.update({
      where: { id: params.id },
      data: updateData,
      include: {
        track: true,
      },
    });

    return successResponse(action);
  } catch (error) {
    return handleApiError(error);
  }
}

// DELETE /api/actions/:id - Delete an action
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.festivalAction.delete({
      where: { id: params.id },
    });

    return successResponse({ message: 'Action deleted successfully' });
  } catch (error) {
    return handleApiError(error);
  }
}
