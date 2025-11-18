/**
 * Domain Event Types
 *
 * Typed events for the festival campaign orchestrator system.
 * These events can be subscribed to by various handlers for side effects.
 */

export type EventType =
  | 'campaign.created'
  | 'campaign.updated'
  | 'campaign.started'
  | 'campaign.completed'
  | 'campaign.archived'
  | 'track.created'
  | 'track.completed'
  | 'action.created'
  | 'action.scheduled'
  | 'action.completed'
  | 'participant.joined'
  | 'participant.dropped'
  | 'participant.completed'
  | 'progress.updated'
  | 'achievement.earned'
  | 'template.created'
  | 'template.used'
  | 'webhook.triggered';

export interface BaseEvent {
  type: EventType;
  timestamp: Date;
  correlationId?: string;
  metadata?: Record<string, unknown>;
}

export interface CampaignCreatedEvent extends BaseEvent {
  type: 'campaign.created';
  data: {
    campaignId: string;
    communityId: string;
    key: string;
    name: string;
    startAt: Date;
    endAt: Date;
    templateId?: string;
  };
}

export interface CampaignUpdatedEvent extends BaseEvent {
  type: 'campaign.updated';
  data: {
    campaignId: string;
    changes: Record<string, unknown>;
  };
}

export interface CampaignStartedEvent extends BaseEvent {
  type: 'campaign.started';
  data: {
    campaignId: string;
    startAt: Date;
  };
}

export interface CampaignCompletedEvent extends BaseEvent {
  type: 'campaign.completed';
  data: {
    campaignId: string;
    endAt: Date;
    totalParticipants: number;
    completionRate: number;
  };
}

export interface ParticipantJoinedEvent extends BaseEvent {
  type: 'participant.joined';
  data: {
    campaignId: string;
    memberId: string;
    joinedAt: Date;
  };
}

export interface ParticipantDroppedEvent extends BaseEvent {
  type: 'participant.dropped';
  data: {
    campaignId: string;
    memberId: string;
  };
}

export interface ParticipantCompletedEvent extends BaseEvent {
  type: 'participant.completed';
  data: {
    campaignId: string;
    memberId: string;
    completedAt: Date;
    totalActions: number;
  };
}

export interface ProgressUpdatedEvent extends BaseEvent {
  type: 'progress.updated';
  data: {
    campaignId: string;
    memberId: string;
    actionId: string;
    completed: boolean;
    progressPercentage: number;
  };
}

export interface AchievementEarnedEvent extends BaseEvent {
  type: 'achievement.earned';
  data: {
    campaignId: string;
    memberId: string;
    achievementKey: string;
    achievementType: string;
    title: string;
  };
}

export interface TrackCreatedEvent extends BaseEvent {
  type: 'track.created';
  data: {
    trackId: string;
    campaignId: string;
    key: string;
    trackType: string;
  };
}

export interface TrackCompletedEvent extends BaseEvent {
  type: 'track.completed';
  data: {
    trackId: string;
    campaignId: string;
    memberId: string;
    completedAt: Date;
  };
}

export interface ActionCreatedEvent extends BaseEvent {
  type: 'action.created';
  data: {
    actionId: string;
    trackId: string;
    actionType: string;
    scheduledAt?: Date;
  };
}

export interface ActionScheduledEvent extends BaseEvent {
  type: 'action.scheduled';
  data: {
    actionId: string;
    trackId: string;
    actionType: string;
    scheduledAt: Date;
  };
}

export interface ActionCompletedEvent extends BaseEvent {
  type: 'action.completed';
  data: {
    actionId: string;
    trackId: string;
    campaignId: string;
    completedAt: Date;
  };
}

export interface TemplateCreatedEvent extends BaseEvent {
  type: 'template.created';
  data: {
    templateId: string;
    key: string;
    name: string;
    category: string;
  };
}

export interface TemplateUsedEvent extends BaseEvent {
  type: 'template.used';
  data: {
    templateId: string;
    campaignId: string;
  };
}

export interface WebhookTriggeredEvent extends BaseEvent {
  type: 'webhook.triggered';
  data: {
    subscriptionId: string;
    eventType: string;
    payload: Record<string, unknown>;
  };
}

export type DomainEvent =
  | CampaignCreatedEvent
  | CampaignUpdatedEvent
  | CampaignStartedEvent
  | CampaignCompletedEvent
  | ParticipantJoinedEvent
  | ParticipantDroppedEvent
  | ParticipantCompletedEvent
  | ProgressUpdatedEvent
  | AchievementEarnedEvent
  | TrackCreatedEvent
  | TrackCompletedEvent
  | ActionCreatedEvent
  | ActionScheduledEvent
  | ActionCompletedEvent
  | TemplateCreatedEvent
  | TemplateUsedEvent
  | WebhookTriggeredEvent;

export type EventHandler<T extends DomainEvent = DomainEvent> = (event: T) => Promise<void> | void;
