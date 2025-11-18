import { z } from 'zod';

// Campaign validation schemas
export const createCampaignSchema = z.object({
  communityId: z.string().min(1),
  key: z.string().min(1),
  name: z.string().min(1),
  descriptionMarkdown: z.string(),
  startAt: z.string().datetime(),
  endAt: z.string().datetime(),
  themeTagsJson: z.array(z.string()).optional(),
});

export const updateCampaignSchema = createCampaignSchema.partial();

// Track validation schemas
export const createTrackSchema = z.object({
  campaignId: z.string().min(1),
  key: z.string().min(1),
  name: z.string().min(1),
  descriptionMarkdown: z.string(),
  trackType: z.enum(['challenge', 'ritual_series', 'content_series']),
  metaJson: z.record(z.unknown()).optional(),
});

export const updateTrackSchema = createTrackSchema.partial().omit({ campaignId: true });

// Action validation schemas
export const createActionSchema = z.object({
  trackId: z.string().min(1),
  orderIndex: z.number().int().min(0),
  actionType: z.enum(['quest', 'ritual', 'post', 'live_session']),
  externalRefJson: z.record(z.unknown()),
  scheduledAt: z.string().datetime().optional(),
});

export const updateActionSchema = createActionSchema.partial().omit({ trackId: true });

// Participant validation schemas
export const joinCampaignSchema = z.object({
  campaignId: z.string().min(1),
  memberId: z.string().min(1),
});

export const updateProgressSchema = z.object({
  campaignId: z.string().min(1),
  memberId: z.string().min(1),
  actionId: z.string().min(1),
  completed: z.boolean(),
  data: z.record(z.unknown()).optional(),
});

export const queryParamsSchema = z.object({
  communityId: z.string().optional(),
  active: z.enum(['true', 'false']).optional(),
  limit: z.string().regex(/^\d+$/).optional(),
  offset: z.string().regex(/^\d+$/).optional(),
});
