// Domain types for festival campaigns

export type TrackType = 'challenge' | 'ritual_series' | 'content_series';
export type ActionType = 'quest' | 'ritual' | 'post' | 'live_session';

// External reference types
export interface QuestRef {
  questId: string;
  questKey: string;
}

export interface RitualRef {
  ritualId: string;
  ritualKey: string;
  frequency?: string;
}

export interface PostRef {
  contentId: string;
  contentType: string;
  topic?: string;
}

export interface LiveSessionRef {
  sessionId: string;
  sessionTitle: string;
  duration?: number;
}

export type ExternalRef = QuestRef | RitualRef | PostRef | LiveSessionRef;

// Progress tracking
export interface ActionProgress {
  actionId: string;
  completed: boolean;
  completedAt?: string;
  data?: Record<string, unknown>;
}

export interface TrackProgress {
  trackId: string;
  actions: ActionProgress[];
}

export interface ParticipantProgress {
  tracks: TrackProgress[];
  totalActionsCompleted: number;
  lastActivityAt?: string;
}

// Track metadata
export interface ChallengeTrackMeta {
  points?: number;
  difficulty?: 'easy' | 'medium' | 'hard';
  badge?: string;
}

export interface RitualSeriesMeta {
  frequency: 'daily' | 'weekly' | 'custom';
  requiredCompletions?: number;
}

export interface ContentSeriesMeta {
  category?: string;
  format?: 'article' | 'video' | 'podcast';
}

export type TrackMeta = ChallengeTrackMeta | RitualSeriesMeta | ContentSeriesMeta;
