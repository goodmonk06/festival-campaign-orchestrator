import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createActionSchema } from '@/lib/validations';
import { successResponse, handleApiError } from '@/lib/api-utils';

// POST /api/actions - Create a new action
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = createActionSchema.parse(body);

    const action = await prisma.festivalAction.create({
      data: {
        ...data,
        externalRefJson: JSON.stringify(data.externalRefJson),
        scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : null,
      },
      include: {
        track: true,
      },
    });

    return successResponse(action, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
