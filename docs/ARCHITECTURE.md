# Architecture Guide

## Overview

The Festival Campaign Orchestrator is built as a modern, event-driven system using Next.js 14, TypeScript, and PostgreSQL. It follows Domain-Driven Design principles with clear separation of concerns across layers.

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend (UI)                        │
│              Next.js Pages + React Components                │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      API Layer (Routes)                      │
│        /api/campaigns  /api/templates  /api/analytics        │
│        Request Validation (Zod) + Error Handling             │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                     Service Layer                            │
│   Achievement Service │ Scheduler Service │ Analytics        │
└───────────────────────────┬─────────────────────────────────┘
                            │
            ┌───────────────┴───────────────┐
            ▼                               ▼
┌─────────────────────────┐    ┌───────────────────────────┐
│     Domain Layer        │    │     Event System          │
│  Business Logic + Rules │    │  EventBus + Handlers      │
└──────────┬──────────────┘    └─────────────┬─────────────┘
           │                                  │
           ▼                                  ▼
┌─────────────────────────┐    ┌───────────────────────────┐
│   Data Access Layer     │    │  Integration Layer        │
│   Prisma ORM + Models   │    │  Adapters + Providers     │
└──────────┬──────────────┘    └─────────────┬─────────────┘
           │                                  │
           ▼                                  ▼
┌─────────────────────────┐    ┌───────────────────────────┐
│  PostgreSQL Database    │    │  External Services        │
│  (Campaigns, Progress)  │    │  (Notifications, Content) │
└─────────────────────────┘    └───────────────────────────┘
```

## Directory Structure

```
festival-campaign-orchestrator/
├── src/
│   ├── app/                    # Next.js app router
│   │   ├── api/               # API routes
│   │   │   ├── campaigns/     # Campaign CRUD
│   │   │   ├── templates/     # Template management
│   │   │   ├── analytics/     # Analytics endpoints
│   │   │   ├── achievements/  # Achievement queries
│   │   │   ├── tracks/        # Track management
│   │   │   ├── actions/       # Action management
│   │   │   └── participants/  # Participant flows
│   │   ├── campaigns/[id]/    # Campaign detail page
│   │   ├── member/[id]/       # Member progress page
│   │   ├── layout.tsx         # Root layout
│   │   └── page.tsx           # Homepage
│   ├── lib/                   # Core libraries
│   │   ├── adapters/          # Integration adapters
│   │   │   ├── types.ts       # Adapter interfaces
│   │   │   ├── registry.ts    # Adapter registry
│   │   │   └── implementations/
│   │   ├── events/            # Event system
│   │   │   ├── types.ts       # Event definitions
│   │   │   └── event-bus.ts   # Event dispatcher
│   │   ├── services/          # Business logic services
│   │   │   ├── achievement-service.ts
│   │   │   └── scheduler.ts
│   │   ├── integrations/      # Legacy integrations (deprecated)
│   │   ├── prisma.ts          # Prisma client
│   │   ├── validations.ts     # Zod schemas
│   │   ├── api-utils.ts       # API helpers
│   │   ├── logger.ts          # Structured logging
│   │   └── metrics.ts         # Metrics collection
│   ├── types/                 # TypeScript types
│   │   └── festival.ts        # Domain types
│   ├── cli/                   # CLI tool
│   │   └── index.ts           # Command-line interface
│   └── __tests__/             # Tests
├── prisma/                    # Database
│   ├── schema.prisma          # Prisma schema
│   ├── seed.ts                # Basic seed
│   └── seed-enhanced.ts       # Rich seed data
├── docs/                      # Documentation
├── docker-compose.yml         # Docker services
└── Dockerfile                 # App container
```

## Core Concepts

### 1. Domain Models

#### FestivalCampaign
The root aggregate representing a time-bounded event. Contains:
- Metadata (name, description, dates, status)
- Relationships to tracks, participants, analytics
- Template reference (if instantiated from template)

#### FestivalTrack
Organizes actions into cohesive units:
- **Challenge Tracks**: Point-based competitive activities
- **Ritual Series**: Recurring daily/weekly practices
- **Content Series**: Scheduled educational content

#### FestivalAction
Individual activities within a track:
- **Quest**: External system task
- **Ritual**: Recurring practice
- **Post**: Content publication
- **Live Session**: Synchronous event

#### ParticipantFestivalState
Tracks member progress using flexible JSON:
```typescript
{
  tracks: [
    {
      trackId: "track-1",
      actions: [
        {
          actionId: "action-1",
          completed: true,
          completedAt: "2025-03-01T10:30:00Z",
          data: { score: 100 }
        }
      ]
    }
  ],
  totalActionsCompleted: 5,
  lastActivityAt: "2025-03-01T10:30:00Z"
}
```

### 2. Event-Driven Architecture

The system uses a typed event bus for loose coupling:

```typescript
// Emit events
await eventBus.emit({
  type: 'participant.joined',
  timestamp: new Date(),
  data: {
    campaignId: 'xxx',
    memberId: 'yyy',
    joinedAt: new Date()
  }
});

// Subscribe to events
eventBus.on('participant.joined', async (event) => {
  await sendWelcomeNotification(event.data.memberId);
});
```

**Key Events:**
- `campaign.created` - New campaign created
- `participant.joined` - Member joins campaign
- `progress.updated` - Action completed
- `achievement.earned` - Badge awarded
- `template.used` - Template instantiated

### 3. Adapter Pattern

External integrations use the adapter pattern for flexibility:

```typescript
interface INotificationAdapter {
  sendNotification(params): Promise<Result>;
  sendBulkNotification(recipients, params): Promise<Result[]>;
  scheduleNotification(params & { scheduledAt }): Promise<Result>;
}

// Register implementation
adapterRegistry.register('notification', new NotificationHubAdapter());

// Use anywhere
const adapter = getNotificationAdapter();
await adapter.sendNotification({ ... });
```

**Available Adapters:**
- `INotificationAdapter` - Notification delivery
- `IContentAdapter` - Content scheduling
- `IRitualAdapter` - Ritual orchestration
- `IMetricsAdapter` - Metrics collection
- `IAnalyticsAdapter` - Event tracking
- `IStorageAdapter` - File storage
- `IProfileAdapter` - User profile lookup

### 4. Service Layer

Business logic is encapsulated in services:

#### AchievementService
- Checks achievement conditions
- Awards badges to participants
- Emits achievement events

#### Scheduler Service
- Orchestrates campaign launches
- Coordinates integration calls
- Handles participant onboarding

### 5. Observability

**Logging:**
```typescript
logger.info('Processing request', {
  campaignId: 'xxx',
  memberId: 'yyy'
});
```

**Metrics:**
```typescript
metrics.incrementCounter(MetricNames.API_REQUEST, 1, {
  endpoint: '/api/campaigns',
  method: 'POST'
});

metrics.recordHistogram(MetricNames.API_REQUEST_DURATION, duration);
```

## Data Flow Examples

### Creating a Campaign from Template

```
1. POST /api/templates/{id}/instantiate
2. Validate request (Zod)
3. Fetch template with tracks/actions
4. Create campaign with all nested data
5. Calculate scheduled times from offsets
6. Create analytics record
7. Increment template usage count
8. Emit CampaignCreatedEvent + TemplateUsedEvent
9. Return campaign data
```

### Participant Joins Campaign

```
1. POST /api/participants/join
2. Validate campaign is active
3. Check not already joined
4. Create ParticipantFestivalState
5. Initialize progress JSON
6. Emit ParticipantJoinedEvent
7. Event handlers:
   - Send welcome notification
   - Activate ritual schedules
   - Track in analytics
8. Return participant data
```

### Update Progress

```
1. POST /api/participants/progress
2. Fetch participant + campaign
3. Validate action belongs to campaign
4. Update progress JSON
5. Update completion counts
6. Save to database
7. Emit ProgressUpdatedEvent
8. Async: Check achievements
9. Return updated progress
```

## Scaling Considerations

### Current Architecture
- Monolithic Next.js app
- Single PostgreSQL database
- In-memory event bus
- Synchronous operations

### Future Scaling Paths

1. **Horizontal Scaling**
   - Deploy multiple app instances behind load balancer
   - Replace in-memory event bus with Redis pub/sub or RabbitMQ
   - Add Redis for caching and sessions

2. **Service Decomposition**
   - Extract achievement service → microservice
   - Extract analytics → separate service
   - Extract scheduler → background worker

3. **Database Optimization**
   - Add read replicas for queries
   - Implement CQRS pattern (separate read/write models)
   - Cache frequently accessed data in Redis

4. **Async Processing**
   - Move achievement checks to queue (Bull, BullMQ)
   - Process analytics calculations async
   - Handle webhook deliveries in background

5. **Event Streaming**
   - Replace event bus with Kafka or AWS EventBridge
   - Enable event replay and audit trails
   - Support real-time data pipelines

## Security Considerations

- **Input Validation**: All API inputs validated with Zod
- **SQL Injection**: Protected by Prisma parameterized queries
- **Authentication**: Not implemented (delegate to API gateway)
- **Authorization**: Not implemented (delegate to API gateway)
- **Rate Limiting**: TODO
- **CORS**: Configure in production

## Performance Optimizations

1. **Database Indexes**: Strategic indexes on foreign keys and query patterns
2. **Eager Loading**: Use Prisma includes to avoid N+1 queries
3. **Pagination**: All list endpoints support limit/offset
4. **Caching**: TODO - Add Redis for hot data
5. **Connection Pooling**: Prisma manages connection pool

## Testing Strategy

1. **Unit Tests**: Services, utilities, validators
2. **Integration Tests**: API routes with test database
3. **E2E Tests**: Full user flows through UI
4. **Load Tests**: TODO - Artillery or k6

## Deployment

### Development
```bash
npm run dev
```

### Production
```bash
docker-compose up -d
```

### Migration
```bash
npm run db:migrate:deploy
npm run db:seed:enhanced
```

## Monitoring & Alerts

### Metrics to Track
- API request rate and latency
- Database query performance
- Integration call success rate
- Event processing lag
- Campaign participation rate
- Achievement award rate

### Recommended Tools
- **APM**: DataDog, New Relic, or Sentry
- **Logs**: CloudWatch, Datadog Logs, or ELK
- **Metrics**: Prometheus + Grafana
- **Alerts**: PagerDuty or Opsgenie
