import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { successResponse, errorResponse, handleApiError } from '@/lib/api-utils';
import { logger } from '@/lib/logger';

// GET /api/templates/:id - Get a specific template
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const template = await prisma.campaignTemplate.findUnique({
      where: { id: params.id },
      include: {
        trackTemplates: {
          include: {
            actionTemplates: {
              orderBy: { orderIndex: 'asc' },
            },
          },
          orderBy: { orderIndex: 'asc' },
        },
        _count: {
          select: { campaigns: true },
        },
      },
    });

    if (!template) {
      return errorResponse('Template not found', 404);
    }

    return successResponse(template);
  } catch (error) {
    return handleApiError(error);
  }
}

// DELETE /api/templates/:id - Delete a template
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    logger.info('Deleting campaign template', { templateId: params.id });

    await prisma.campaignTemplate.delete({
      where: { id: params.id },
    });

    logger.info('Campaign template deleted', { templateId: params.id });

    return successResponse({ message: 'Template deleted successfully' });
  } catch (error) {
    return handleApiError(error);
  }
}
