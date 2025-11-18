# Domain Model Deep Dive

## Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    CampaignTemplate                          │
│  - Templates for reusable campaign blueprints               │
│  - Contains track and action templates                      │
└──────────────────┬──────────────────────────────────────────┘
                   │ 1:N
                   ▼
┌──────────────────────────────────────────────────────────────┐
│                    TrackTemplate                              │
│  - Template for a single track                               │
└──────────────────┬──────────────────────────────────────────┘
                   │ 1:N
                   ▼
┌──────────────────────────────────────────────────────────────┐
│                    ActionTemplate                             │
│  - Template for individual actions                           │
└──────────────────────────────────────────────────────────────┘

                   │ Template
                   │ instantiates
                   ▼

┌──────────────────────────────────────────────────────────────┐
│                    FestivalCampaign                           │
│  - Root aggregate for a festival event                       │
│  - Time-bounded with start/end dates                         │
│  - Can be created from template or from scratch              │
└───┬─────────────┬─────────────┬────────────┬────────────────┘
    │ 1:N         │ 1:1         │ M:N        │ 1:N
    ▼             ▼             ▼            ▼
┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────┐
│  Track   │  │Analytics │  │   Tags   │  │   Participants   │
└──────────┘  └──────────┘  └──────────┘  └──────────────────┘
    │ 1:N                                        │ 1:N
    ▼                                            ▼
┌──────────┐                              ┌──────────────────┐
│  Action  │                              │  Achievements    │
└──────────┘                              └──────────────────┘
```

## Core Entities

### 1. FestivalCampaign

**Purpose**: Represents a complete festival event with multiple tracks and participant management.

**Attributes**:
- `id` (cuid): Unique identifier
- `communityId` (string): Associated community
- `key` (string, unique): URL-friendly identifier
- `name` (string): Display name
- `descriptionMarkdown` (text): Rich description
- `startAt` (datetime): When campaign begins
- `endAt` (datetime): When campaign ends
- `status` (enum): draft | active | completed | archived
- `templateId` (optional): Source template if instantiated
- `themeTagsJson` (json): Array of theme keywords

**Relationships**:
- `tracks[]` - One-to-Many FestivalTrack
- `participants[]` - One-to-Many ParticipantFestivalState
- `analytics` - One-to-One CampaignAnalytics
- `achievements[]` - One-to-Many MemberAchievement
- `tags[]` - Many-to-Many CampaignTag (via CampaignTagRelation)
- `integrationLogs[]` - One-to-Many IntegrationLog
- `webhookDeliveries[]` - One-to-Many WebhookDelivery

**Business Rules**:
- Status can only progress forward (draft → active → completed → archived)
- Cannot delete campaign with active participants
- Start date must be before end date
- Key must be unique across all campaigns

**State Transitions**:
```
draft --[activate]--> active --[complete]--> completed --[archive]--> archived
                        ↓
                   [pause/resume]
```

---

### 2. FestivalTrack

**Purpose**: Groups related actions into a cohesive experience within a campaign.

**Track Types**:

#### Challenge Track
- Competitive, point-based activities
- Participants earn scores and rankings
- Often has leaderboards and rewards
- Example: "30-Day Fitness Challenge"

**Metadata**:
```json
{
  "points": 1000,
  "difficulty": "medium",
  "badge": "fitness-champion"
}
```

#### Ritual Series
- Recurring daily/weekly practices
- Focus on consistency and habit-building
- Tracks streaks and completion rates
- Example: "Morning Meditation Series"

**Metadata**:
```json
{
  "frequency": "daily",
  "requiredCompletions": 21,
  "reminderTime": "06:00"
}
```

#### Content Series
- Scheduled educational content
- Articles, videos, podcasts
- May include live sessions
- Example: "Spring Wisdom Series"

**Metadata**:
```json
{
  "category": "educational",
  "format": "article",
  "estimatedDuration": 15
}
```

**Attributes**:
- `id` (cuid): Unique identifier
- `campaignId` (string): Parent campaign
- `key` (string): Unique within campaign
- `name` (string): Display name
- `descriptionMarkdown` (text): Description
- `trackType` (enum): challenge | ritual_series | content_series
- `metaJson` (json): Type-specific metadata
- `orderIndex` (int): Display order

**Business Rules**:
- Key must be unique within a campaign
- Cannot change trackType after creation
- Order index determines display sequence

---

### 3. FestivalAction

**Purpose**: Individual activities that participants complete within a track.

**Action Types**:

#### Quest
- Task to complete in external quest system
- May have conditions or prerequisites
- Awards points or items upon completion

**External Reference**:
```json
{
  "questId": "quest-123",
  "questKey": "morning-meditation",
  "requiredLevel": 5
}
```

#### Ritual
- Recurring practice to perform
- Tracked for consistency
- Contributes to streaks

**External Reference**:
```json
{
  "ritualId": "ritual-456",
  "ritualKey": "gratitude-journal",
  "frequency": "daily"
}
```

#### Post
- Content to consume
- Article, video, or podcast
- May trigger external content system

**External Reference**:
```json
{
  "contentId": "post-789",
  "contentType": "article",
  "topic": "Mindfulness Basics",
  "url": "https://..."
}
```

#### Live Session
- Synchronous event
- Scheduled at specific time
- Limited capacity

**External Reference**:
```json
{
  "sessionId": "session-321",
  "sessionTitle": "Spring Equinox Celebration",
  "duration": 90,
  "capacity": 100
}
```

**Attributes**:
- `id` (cuid): Unique identifier
- `trackId` (string): Parent track
- `orderIndex` (int): Sequence within track
- `actionType` (enum): quest | ritual | post | live_session
- `externalRefJson` (json): Type-specific reference
- `scheduledAt` (datetime, optional): When action becomes available
- `status` (enum): pending | scheduled | completed | failed

**Business Rules**:
- Order index determines completion sequence
- Scheduled actions only available after scheduledAt
- Status automatically updated by integrations

---

### 4. ParticipantFestivalState

**Purpose**: Tracks a member's progress through a campaign.

**Progress JSON Structure**:
```typescript
interface ParticipantProgress {
  tracks: TrackProgress[];
  totalActionsCompleted: number;
  lastActivityAt?: string;
}

interface TrackProgress {
  trackId: string;
  actions: ActionProgress[];
}

interface ActionProgress {
  actionId: string;
  completed: boolean;
  completedAt?: string;
  data?: Record<string, unknown>; // Custom data from external systems
}
```

**Attributes**:
- `id` (cuid): Unique identifier
- `campaignId` (string): Campaign reference
- `memberId` (string): User reference
- `joinedAt` (datetime): When participant joined
- `progressJson` (json): Flexible progress tracking
- `status` (enum): active | completed | dropped
- `lastUpdatedAt` (datetime): Auto-updated timestamp

**Business Rules**:
- Unique per (campaignId, memberId) pair
- Status changes based on completion percentage
- Cannot rejoin after dropping

**Status Transitions**:
```
[join] --> active --[complete all]--> completed
              │
              └--[inactive 30 days]--> dropped
```

---

### 5. CampaignTemplate

**Purpose**: Reusable blueprint for creating campaigns with predefined tracks and actions.

**Use Cases**:
- Seasonal campaigns (quarterly challenges)
- Onboarding programs
- Recurring events
- Multi-community rollouts

**Attributes**:
- `id` (cuid): Unique identifier
- `key` (string, unique): URL-friendly identifier
- `name` (string): Template name
- `descriptionMarkdown` (text): Description
- `category` (enum): general | challenge | ritual | content | hybrid
- `configJson` (json): Template configuration
- `isPublic` (boolean): Visibility
- `usageCount` (int): How many times used
- `createdBy` (optional): Creator reference

**Template Configuration Example**:
```json
{
  "defaultDuration": 30,
  "allowCustomization": true,
  "requiredFields": ["communityId", "startAt"],
  "recommendedTags": ["mindfulness", "growth"]
}
```

**Instantiation Process**:
1. Select template
2. Provide campaign-specific details (name, dates, community)
3. System creates campaign with all tracks/actions
4. Scheduled times calculated from offsets
5. Template usage count incremented

---

### 6. TrackTemplate & ActionTemplate

**Purpose**: Nested blueprints within a campaign template.

**ActionTemplate Scheduled Offset**:
- Offset in minutes from campaign start
- Example: 360 = 6am on first day
- Example: 10080 = 1 week after start

**Benefits**:
- Consistent track structure across campaigns
- Easy updates to all future campaigns
- Proven patterns and best practices encoded

---

### 7. CampaignAnalytics

**Purpose**: Real-time metrics for monitoring campaign health and engagement.

**Calculated Metrics**:
- `totalParticipants`: All time joiners
- `activeParticipants`: Currently engaged
- `completedParticipants`: Finished all tracks
- `droppedParticipants`: Inactive > 30 days
- `totalActions`: Sum of all actions across tracks
- `completedActions`: Total completions by all participants
- `averageCompletion`: Percentage (0.0 - 1.0)
- `engagementScore`: Weighted score (0-100)

**Engagement Score Formula**:
```
participationRate = activeParticipants / totalParticipants
engagementScore = (participationRate * 0.4) + (averageCompletion * 0.6) * 100
```

**Metrics JSON** (flexible for custom metrics):
```json
{
  "dailyActiveUsers": [5, 6, 7, 8, 8, 7, 8],
  "completionTrend": [0.1, 0.15, 0.2, 0.25],
  "topPerformers": ["member-001", "member-005"],
  "peakHours": [6, 9, 21]
}
```

**Recalculation**:
- Triggered manually via API
- Background job (hourly/daily)
- On-demand for dashboards

---

### 8. MemberAchievement

**Purpose**: Badge/reward system for recognizing participant accomplishments.

**Achievement Types**:

#### track_completed
Awarded when completing an entire track
```json
{
  "trackKey": "morning-rituals",
  "trackName": "Morning Ritual Challenge",
  "completionDate": "2025-03-21"
}
```

#### campaign_completed
Awarded when completing all tracks
```json
{
  "totalTracks": 3,
  "totalActions": 25,
  "completionDate": "2025-03-31"
}
```

#### streak
Awarded for consecutive completions
```json
{
  "streakLength": 7,
  "startDate": "2025-03-01",
  "endDate": "2025-03-07"
}
```

#### perfect_score
Awarded for 100% completion with no missed actions
```json
{
  "totalActions": 25,
  "perfectScore": true,
  "bonusPoints": 500
}
```

#### early_bird
Awarded for joining within first 24 hours
```json
{
  "joinedHoursAfterStart": 2,
  "campaignStartDate": "2025-03-01T00:00:00Z"
}
```

**Attributes**:
- `id` (cuid): Unique identifier
- `campaignId` (string): Campaign reference
- `memberId` (string): User reference
- `achievementType` (enum): Type of achievement
- `achievementKey` (string): Unique key for this achievement
- `title` (string): Display title with emoji
- `description` (string): What was accomplished
- `badgeImageUrl` (optional): Badge graphic
- `dataJson` (json): Achievement-specific data
- `earnedAt` (datetime): When awarded

**Business Rules**:
- Unique per (campaignId, memberId, achievementKey)
- Cannot be revoked once earned
- Automatically checked on progress updates

---

### 9. CampaignTag

**Purpose**: Categorization and discoverability system for campaigns.

**Use Cases**:
- Filter campaigns by theme
- Recommend similar campaigns
- Track trends across communities
- Search and discovery

**Common Tags**:
- Themes: mindfulness, fitness, creativity, learning
- Seasons: spring, summer, fall, winter
- Difficulty: beginner, intermediate, advanced
- Duration: quick, medium, long-term

**Attributes**:
- `id` (cuid): Unique identifier
- `key` (string, unique): URL-friendly identifier
- `name` (string): Display name
- `description` (optional): Tag description
- `color` (hex): Visual representation

**Many-to-Many Relationship**:
Campaigns can have multiple tags, tags can be on multiple campaigns via `CampaignTagRelation`.

---

### 10. NotificationLog & IntegrationLog

**Purpose**: Audit trails for debugging and monitoring external system interactions.

**NotificationLog**:
- Tracks all notifications sent to participants
- Status: pending | sent | failed
- Stores error messages for failed deliveries
- Used for retry logic and debugging

**IntegrationLog**:
- Tracks calls to external services
- Records request/response payloads
- Measures integration latency
- Identifies failing integrations

**Retention Policy**:
- Keep logs for 90 days
- Archive older logs to cold storage
- Use for troubleshooting and metrics

---

### 11. WebhookSubscription & WebhookDelivery

**Purpose**: Enable external systems to receive real-time events from campaigns.

**WebhookSubscription**:
- External service registers interest in events
- Provides callback URL and secret
- Specifies which event types to receive

**WebhookDelivery**:
- Records each webhook delivery attempt
- Tracks success/failure status
- Implements retry logic with exponential backoff
- Stores response for debugging

**Retry Strategy**:
1. Immediate delivery
2. Retry after 1 minute (if failed)
3. Retry after 5 minutes
4. Retry after 30 minutes
5. Mark as permanently failed

---

## Domain Events

Events represent things that have happened in the domain:

```typescript
CampaignCreatedEvent
CampaignStartedEvent
CampaignCompletedEvent
ParticipantJoinedEvent
ParticipantCompletedEvent
ProgressUpdatedEvent
AchievementEarnedEvent
TrackCompletedEvent
ActionCompletedEvent
TemplateUsedEvent
WebhookTriggeredEvent
```

**Event Properties**:
- `type`: Event type identifier
- `timestamp`: When event occurred
- `data`: Event-specific payload
- `correlationId`: For tracing related events
- `metadata`: Additional context

**Event Handlers**:
- Notification delivery
- Analytics updates
- Achievement checks
- Webhook deliveries
- Integration calls

---

## Aggregates & Bounded Contexts

### Campaign Aggregate
Root: FestivalCampaign
Entities: FestivalTrack, FestivalAction
Value Objects: TrackMeta, ExternalRef

**Invariants**:
- Campaign dates are valid
- All tracks belong to campaign
- All actions belong to tracks

### Participant Aggregate
Root: ParticipantFestivalState
Value Objects: ParticipantProgress, ActionProgress

**Invariants**:
- Progress is consistent with actions
- Completion counts are accurate
- Status reflects actual progress

### Template Aggregate
Root: CampaignTemplate
Entities: TrackTemplate, ActionTemplate

**Invariants**:
- Template structure is complete
- Offsets are valid
- Track keys are unique

---

## Consistency Boundaries

### Strong Consistency
- Campaign creation with tracks/actions (single transaction)
- Progress updates (atomic JSON update)
- Achievement awards (unique constraint)

### Eventual Consistency
- Analytics recalculation (async job)
- Webhook deliveries (retry queue)
- Integration calls (fire and forget)
- Event handling (async handlers)

---

## Future Domain Enhancements

1. **Campaign Variations** (A/B Testing)
2. **Participant Groups** (Teams, Cohorts)
3. **Dynamic Actions** (Conditional logic)
4. **Reward System** (Points, Currency, Items)
5. **Social Features** (Comments, Reactions, Sharing)
6. **Leaderboards** (Rankings, Competitions)
7. **Surveys & Feedback** (Post-campaign assessment)
8. **Campaign Cloning** (Duplicate with modifications)
