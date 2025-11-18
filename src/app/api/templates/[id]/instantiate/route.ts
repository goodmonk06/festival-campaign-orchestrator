import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { successResponse, errorResponse, handleApiError } from '@/lib/api-utils';
import { logger } from '@/lib/logger';
import { eventBus } from '@/lib/events/event-bus';
import type { CampaignCreatedEvent, TemplateUsedEvent } from '@/lib/events/types';

const instantiateSchema = z.object({
  communityId: z.string().min(1),
  key: z.string().min(1),
  name: z.string().min(1),
  descriptionMarkdown: z.string().optional(),
  startAt: z.string().datetime(),
  endAt: z.string().datetime(),
  themeTagsJson: z.array(z.string()).optional(),
  overrides: z
    .object({
      tracks: z.record(z.unknown()).optional(),
      actions: z.record(z.unknown()).optional(),
    })
    .optional(),
});

// POST /api/templates/:id/instantiate - Create a campaign from template
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    const data = instantiateSchema.parse(body);

    logger.info('Instantiating campaign from template', {
      templateId: params.id,
      communityId: data.communityId,
      key: data.key,
    });

    // Fetch the template with all nested data
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
      },
    });

    if (!template) {
      return errorResponse('Template not found', 404);
    }

    const startAt = new Date(data.startAt);
    const endAt = new Date(data.endAt);

    // Create campaign from template
    const campaign = await prisma.festivalCampaign.create({
      data: {
        communityId: data.communityId,
        key: data.key,
        name: data.name,
        descriptionMarkdown: data.descriptionMarkdown || template.descriptionMarkdown,
        startAt,
        endAt,
        themeTagsJson: data.themeTagsJson ? JSON.stringify(data.themeTagsJson) : '[]',
        status: 'draft',
        templateId: template.id,
        tracks: {
          create: template.trackTemplates.map((trackTemplate) => ({
            key: trackTemplate.key,
            name: trackTemplate.name,
            descriptionMarkdown: trackTemplate.descriptionMarkdown,
            trackType: trackTemplate.trackType,
            metaJson: trackTemplate.metaJson,
            orderIndex: trackTemplate.orderIndex,
            actions: {
              create: trackTemplate.actionTemplates.map((actionTemplate) => {
                // Calculate scheduled time based on offset
                let scheduledAt: Date | null = null;
                if (actionTemplate.scheduledOffset !== null) {
                  scheduledAt = new Date(startAt);
                  scheduledAt.setMinutes(scheduledAt.getMinutes() + actionTemplate.scheduledOffset);
                }

                return {
                  orderIndex: actionTemplate.orderIndex,
                  actionType: actionTemplate.actionType,
                  externalRefJson: actionTemplate.externalRefJson,
                  scheduledAt,
                  status: 'pending',
                };
              }),
            },
          })),
        },
        analytics: {
          create: {
            totalActions: template.trackTemplates.reduce(
              (sum, track) => sum + track.actionTemplates.length,
              0
            ),
          },
        },
      },
      include: {
        tracks: {
          include: {
            actions: {
              orderBy: { orderIndex: 'asc' },
            },
          },
        },
        analytics: true,
      },
    });

    // Increment template usage count
    await prisma.campaignTemplate.update({
      where: { id: template.id },
      data: {
        usageCount: { increment: 1 },
      },
    });

    logger.info('Campaign instantiated from template', {
      campaignId: campaign.id,
      templateId: template.id,
      trackCount: campaign.tracks.length,
    });

    // Emit events
    const campaignCreatedEvent: CampaignCreatedEvent = {
      type: 'campaign.created',
      timestamp: new Date(),
      data: {
        campaignId: campaign.id,
        communityId: campaign.communityId,
        key: campaign.key,
        name: campaign.name,
        startAt: campaign.startAt,
        endAt: campaign.endAt,
        templateId: template.id,
      },
    };

    const templateUsedEvent: TemplateUsedEvent = {
      type: 'template.used',
      timestamp: new Date(),
      data: {
        templateId: template.id,
        campaignId: campaign.id,
      },
    };

    await Promise.all([
      eventBus.emit(campaignCreatedEvent),
      eventBus.emit(templateUsedEvent),
    ]);

    return successResponse(campaign, 201);
  } catch (error) {
    logger.error('Failed to instantiate campaign from template', {
      templateId: params.id,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return handleApiError(error);
  }
}
