import {
  createCampaignSchema,
  createTrackSchema,
  createActionSchema,
  joinCampaignSchema,
  updateProgressSchema,
} from '@/lib/validations';

describe('Validation Schemas', () => {
  describe('createCampaignSchema', () => {
    it('should validate a valid campaign', () => {
      const validCampaign = {
        communityId: 'comm-123',
        key: 'spring-2025',
        name: 'Spring Festival',
        descriptionMarkdown: '# Spring Festival\n\nA great event!',
        startAt: '2025-03-01T00:00:00Z',
        endAt: '2025-03-31T23:59:59Z',
        themeTagsJson: ['spring', 'festival'],
      };

      const result = createCampaignSchema.safeParse(validCampaign);
      expect(result.success).toBe(true);
    });

    it('should reject campaign with missing required fields', () => {
      const invalidCampaign = {
        communityId: 'comm-123',
        name: 'Spring Festival',
        // Missing key, descriptionMarkdown, startAt, endAt
      };

      const result = createCampaignSchema.safeParse(invalidCampaign);
      expect(result.success).toBe(false);
    });

    it('should reject campaign with invalid date format', () => {
      const invalidCampaign = {
        communityId: 'comm-123',
        key: 'spring-2025',
        name: 'Spring Festival',
        descriptionMarkdown: 'Description',
        startAt: 'invalid-date',
        endAt: '2025-03-31T23:59:59Z',
      };

      const result = createCampaignSchema.safeParse(invalidCampaign);
      expect(result.success).toBe(false);
    });
  });

  describe('createTrackSchema', () => {
    it('should validate a valid track', () => {
      const validTrack = {
        campaignId: 'camp-123',
        key: 'morning-rituals',
        name: 'Morning Rituals',
        descriptionMarkdown: 'Daily morning practices',
        trackType: 'ritual_series' as const,
        metaJson: { frequency: 'daily' },
      };

      const result = createTrackSchema.safeParse(validTrack);
      expect(result.success).toBe(true);
    });

    it('should reject track with invalid trackType', () => {
      const invalidTrack = {
        campaignId: 'camp-123',
        key: 'invalid-track',
        name: 'Invalid Track',
        descriptionMarkdown: 'Description',
        trackType: 'invalid_type',
      };

      const result = createTrackSchema.safeParse(invalidTrack);
      expect(result.success).toBe(false);
    });
  });

  describe('createActionSchema', () => {
    it('should validate a valid action', () => {
      const validAction = {
        trackId: 'track-123',
        orderIndex: 1,
        actionType: 'quest' as const,
        externalRefJson: { questId: 'quest-001', questKey: 'morning-quest' },
        scheduledAt: '2025-03-01T06:00:00Z',
      };

      const result = createActionSchema.safeParse(validAction);
      expect(result.success).toBe(true);
    });

    it('should validate action without scheduledAt', () => {
      const validAction = {
        trackId: 'track-123',
        orderIndex: 1,
        actionType: 'ritual' as const,
        externalRefJson: { ritualId: 'ritual-001' },
      };

      const result = createActionSchema.safeParse(validAction);
      expect(result.success).toBe(true);
    });

    it('should reject action with invalid actionType', () => {
      const invalidAction = {
        trackId: 'track-123',
        orderIndex: 1,
        actionType: 'invalid_action',
        externalRefJson: {},
      };

      const result = createActionSchema.safeParse(invalidAction);
      expect(result.success).toBe(false);
    });
  });

  describe('joinCampaignSchema', () => {
    it('should validate valid join request', () => {
      const validJoin = {
        campaignId: 'camp-123',
        memberId: 'member-456',
      };

      const result = joinCampaignSchema.safeParse(validJoin);
      expect(result.success).toBe(true);
    });

    it('should reject empty campaignId or memberId', () => {
      const invalidJoin = {
        campaignId: '',
        memberId: 'member-456',
      };

      const result = joinCampaignSchema.safeParse(invalidJoin);
      expect(result.success).toBe(false);
    });
  });

  describe('updateProgressSchema', () => {
    it('should validate valid progress update', () => {
      const validProgress = {
        campaignId: 'camp-123',
        memberId: 'member-456',
        actionId: 'action-789',
        completed: true,
        data: { score: 100 },
      };

      const result = updateProgressSchema.safeParse(validProgress);
      expect(result.success).toBe(true);
    });

    it('should validate progress update without optional data', () => {
      const validProgress = {
        campaignId: 'camp-123',
        memberId: 'member-456',
        actionId: 'action-789',
        completed: false,
      };

      const result = updateProgressSchema.safeParse(validProgress);
      expect(result.success).toBe(true);
    });
  });
});
