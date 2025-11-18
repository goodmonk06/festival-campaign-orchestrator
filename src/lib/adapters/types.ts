/**
 * Adapter Interfaces
 *
 * Defines contracts for external service integrations.
 * Allows swapping implementations without changing business logic.
 */

// Notification Adapter
export interface SendNotificationParams {
  recipientId: string;
  type: 'campaign_start' | 'campaign_reminder' | 'action_available' | 'achievement_unlocked';
  title: string;
  body: string;
  metadata?: Record<string, unknown>;
}

export interface SendNotificationResult {
  success: boolean;
  notificationId: string;
  sentAt: Date;
  error?: string;
}

export interface INotificationAdapter {
  sendNotification(params: SendNotificationParams): Promise<SendNotificationResult>;
  sendBulkNotification(
    recipientIds: string[],
    params: Omit<SendNotificationParams, 'recipientId'>
  ): Promise<SendNotificationResult[]>;
  scheduleNotification(
    params: SendNotificationParams & { scheduledAt: Date }
  ): Promise<{ success: boolean; scheduledNotificationId: string }>;
}

// Content Calendar Adapter
export interface ScheduleContentParams {
  contentId: string;
  contentType: string;
  scheduledAt: Date;
  topic?: string;
  campaignId: string;
}

export interface ScheduleContentResult {
  success: boolean;
  contentCalendarId: string;
  scheduledAt: Date;
  error?: string;
}

export interface IContentAdapter {
  scheduleContent(params: ScheduleContentParams): Promise<ScheduleContentResult>;
  cancelScheduledContent(contentCalendarId: string): Promise<void>;
  getScheduledContent(contentCalendarId: string): Promise<ScheduleContentResult | null>;
}

// Ritual Orchestrator Adapter
export interface ActivateRitualParams {
  ritualId: string;
  ritualKey: string;
  memberId: string;
  frequency: 'daily' | 'weekly' | 'custom';
  startDate: Date;
  endDate: Date;
  campaignId: string;
}

export interface ActivateRitualResult {
  success: boolean;
  ritualScheduleId: string;
  nextOccurrence?: Date;
  error?: string;
}

export interface RecordRitualCompletionParams {
  ritualScheduleId: string;
  memberId: string;
  completedAt: Date;
  metadata?: Record<string, unknown>;
}

export interface RitualStatsResult {
  totalCompletions: number;
  currentStreak: number;
  longestStreak: number;
}

export interface IRitualAdapter {
  activateRitual(params: ActivateRitualParams): Promise<ActivateRitualResult>;
  recordRitualCompletion(params: RecordRitualCompletionParams): Promise<{ success: boolean }>;
  deactivateRitual(ritualScheduleId: string): Promise<void>;
  getRitualStats(ritualScheduleId: string): Promise<RitualStatsResult>;
}

// Metrics Adapter
export interface IMetricsAdapter {
  recordCounter(name: string, value?: number, labels?: Record<string, string | number>): void;
  recordGauge(name: string, value: number, labels?: Record<string, string | number>): void;
  recordHistogram(name: string, value: number, labels?: Record<string, string | number>): void;
  recordTiming(name: string, duration: number, labels?: Record<string, string | number>): void;
}

// Analytics Adapter
export interface TrackEventParams {
  eventName: string;
  userId?: string;
  properties?: Record<string, unknown>;
  timestamp?: Date;
}

export interface IAnalyticsAdapter {
  trackEvent(params: TrackEventParams): Promise<void>;
  identifyUser(userId: string, traits?: Record<string, unknown>): Promise<void>;
  trackPageView(path: string, userId?: string): Promise<void>;
}

// Storage Adapter (for file uploads, images, etc.)
export interface UploadFileParams {
  file: Buffer;
  filename: string;
  contentType: string;
  folder?: string;
}

export interface UploadFileResult {
  success: boolean;
  url: string;
  key: string;
  error?: string;
}

export interface IStorageAdapter {
  uploadFile(params: UploadFileParams): Promise<UploadFileResult>;
  deleteFile(key: string): Promise<void>;
  getSignedUrl(key: string, expiresIn?: number): Promise<string>;
}

// External Profile Adapter (for fetching user data from auth/profile service)
export interface ExternalProfile {
  userId: string;
  username?: string;
  displayName?: string;
  email?: string;
  avatar?: string;
  metadata?: Record<string, unknown>;
}

export interface IProfileAdapter {
  getProfile(userId: string): Promise<ExternalProfile | null>;
  getProfiles(userIds: string[]): Promise<ExternalProfile[]>;
}
