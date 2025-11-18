import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { successResponse, errorResponse, handleApiError } from '@/lib/api-utils';
import { logger } from '@/lib/logger';
import { metrics, MetricNames } from '@/lib/metrics';

// Validation schemas
const createTemplateSchema = z.object({
  key: z.string().min(1),
  name: z.string().min(1),
  descriptionMarkdown: z.string(),
  category: z.enum(['general', 'challenge', 'ritual', 'content', 'hybrid']).default('general'),
  configJson: z.record(z.unknown()).optional(),
  isPublic: z.boolean().default(true),
  createdBy: z.string().optional(),
  trackTemplates: z
    .array(
      z.object({
        key: z.string().min(1),
        name: z.string().min(1),
        descriptionMarkdown: z.string(),
        trackType: z.enum(['challenge', 'ritual_series', 'content_series']),
        metaJson: z.record(z.unknown()).optional(),
        orderIndex: z.number().int().min(0).default(0),
        actionTemplates: z
          .array(
            z.object({
              orderIndex: z.number().int().min(0),
              actionType: z.enum(['quest', 'ritual', 'post', 'live_session']),
              externalRefJson: z.record(z.unknown()),
              scheduledOffset: z.number().int().optional(), // Minutes from campaign start
            })
          )
          .optional(),
      })
    )
    .optional(),
});

const queryParamsSchema = z.object({
  category: z.string().optional(),
  isPublic: z.enum(['true', 'false']).optional(),
  limit: z.string().regex(/^\d+$/).optional(),
  offset: z.string().regex(/^\d+$/).optional(),
});

// GET /api/templates - List templates
export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    const searchParams = Object.fromEntries(request.nextUrl.searchParams.entries());
    const params = queryParamsSchema.parse(searchParams);

    const where: any = {};

    if (params.category) {
      where.category = params.category;
    }

    if (params.isPublic) {
      where.isPublic = params.isPublic === 'true';
    }

    const limit = params.limit ? parseInt(params.limit) : 50;
    const offset = params.offset ? parseInt(params.offset) : 0;

    const templates = await prisma.campaignTemplate.findMany({
      where,
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
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });

    const total = await prisma.campaignTemplate.count({ where });

    const duration = Date.now() - startTime;
    metrics.recordHistogram(MetricNames.API_REQUEST_DURATION, duration, {
      endpoint: '/api/templates',
      method: 'GET',
    });

    return successResponse({
      templates,
      pagination: {
        total,
        limit,
        offset,
      },
    });
  } catch (error) {
    metrics.incrementCounter(MetricNames.API_ERROR, 1, {
      endpoint: '/api/templates',
      method: 'GET',
    });
    return handleApiError(error);
  }
}

// POST /api/templates - Create a new template
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const body = await request.json();
    const data = createTemplateSchema.parse(body);

    logger.info('Creating campaign template', { key: data.key, name: data.name });

    // Create template with nested track and action templates
    const template = await prisma.campaignTemplate.create({
      data: {
        key: data.key,
        name: data.name,
        descriptionMarkdown: data.descriptionMarkdown,
        category: data.category,
        configJson: data.configJson ? JSON.stringify(data.configJson) : '{}',
        isPublic: data.isPublic,
        createdBy: data.createdBy,
        trackTemplates: data.trackTemplates
          ? {
              create: data.trackTemplates.map((track) => ({
                key: track.key,
                name: track.name,
                descriptionMarkdown: track.descriptionMarkdown,
                trackType: track.trackType,
                metaJson: track.metaJson ? JSON.stringify(track.metaJson) : '{}',
                orderIndex: track.orderIndex,
                actionTemplates: track.actionTemplates
                  ? {
                      create: track.actionTemplates.map((action) => ({
                        orderIndex: action.orderIndex,
                        actionType: action.actionType,
                        externalRefJson: JSON.stringify(action.externalRefJson),
                        scheduledOffset: action.scheduledOffset,
                      })),
                    }
                  : undefined,
              })),
            }
          : undefined,
      },
      include: {
        trackTemplates: {
          include: {
            actionTemplates: {
              orderBy: { orderIndex: 'asc' },
            },
          },
        },
      },
    });

    logger.info('Campaign template created', { templateId: template.id, key: template.key });

    const duration = Date.now() - startTime;
    metrics.recordHistogram(MetricNames.API_REQUEST_DURATION, duration, {
      endpoint: '/api/templates',
      method: 'POST',
    });

    return successResponse(template, 201);
  } catch (error) {
    metrics.incrementCounter(MetricNames.API_ERROR, 1, {
      endpoint: '/api/templates',
      method: 'POST',
    });
    return handleApiError(error);
  }
}
