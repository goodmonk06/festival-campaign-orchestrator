# 🎉 Festival Campaign Orchestrator

**A production-ready TypeScript/Next.js system for orchestrating festival-style campaigns with multi-system coordination, event-driven architecture, and comprehensive participant engagement tracking.**

[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-14.2-black)](https://nextjs.org/)
[![Prisma](https://img.shields.io/badge/Prisma-5.19-2D3748)](https://www.prisma.io/)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Architecture](#-architecture)
- [Features](#-features)
- [Getting Started](#-getting-started)
- [API Reference](#-api-reference)
- [CLI Tool](#-cli-tool)
- [Documentation](#-documentation)
- [Development](#-development)
- [Deployment](#-deployment)
- [Contributing](#-contributing)

---

## 🎯 Overview

Festival Campaign Orchestrator is a sophisticated system designed to coordinate complex, time-bounded community engagement campaigns. It serves as the central nervous system for festival-style events, managing multiple tracks, scheduling actions across external systems, tracking participant progress, and providing real-time analytics.

### Key Capabilities

- 🏗️ **Template-Based Campaign Creation** - Reusable blueprints with instant instantiation
- 📊 **Real-Time Analytics** - Engagement scoring, completion tracking, performance metrics
- 🏆 **Achievement System** - Automatic badge awards based on participant progress
- 🔔 **Multi-Channel Integration** - Notifications, content scheduling, ritual orchestration
- 📈 **Event-Driven Architecture** - Typed events with pluggable handlers
- 🔌 **Adapter Pattern** - Swappable external service integrations
- 🎯 **Flexible Progress Tracking** - JSON-based state for extensibility
- 📝 **Comprehensive Audit Trails** - Integration logs, notification history, webhook deliveries

---

## 🏗️ Architecture

### System Overview

```
┌──────────────────────────────────────────────────────────────┐
│                         Frontend UI                           │
│              Campaign List │ Detail │ Progress                │
└───────────────────────────┬──────────────────────────────────┘
                            │
                            ▼
┌──────────────────────────────────────────────────────────────┐
│                      API Layer (Next.js)                      │
│  Campaigns │ Templates │ Analytics │ Achievements │ Progress  │
└───────────────────────────┬──────────────────────────────────┘
                            │
            ┌───────────────┴────────────────┐
            ▼                                ▼
┌─────────────────────────┐     ┌──────────────────────────────┐
│    Service Layer        │     │      Event System            │
│  Achievement Service    │     │  EventBus + Domain Events    │
│  Scheduler Service      │     │  15+ Typed Event Types       │
│  Analytics Calculator   │     └─────────────┬────────────────┘
└──────────┬──────────────┘                   │
           │                                  ▼
           ▼                     ┌──────────────────────────────┐
┌─────────────────────────┐     │   Integration Layer          │
│  Prisma ORM             │     │   Adapter Registry           │
│  PostgreSQL Database    │     │   7 Pluggable Adapters       │
│  15+ Domain Entities    │     └─────────────┬────────────────┘
└─────────────────────────┘                   │
                                              ▼
                                ┌──────────────────────────────┐
                                │   External Services          │
                                │   Notifications │ Content    │
                                │   Rituals │ Analytics        │
                                └──────────────────────────────┘
```

### Domain Model (Core Entities)

```
CampaignTemplate                 FestivalCampaign
├── Track Templates              ├── Tracks (Challenge, Ritual, Content)
└── Action Templates             │   └── Actions (Quest, Ritual, Post, Live)
       │                         ├── Participants + Progress
       └─[instantiate]──────────>├── Analytics (Real-time metrics)
                                 ├── Achievements (Auto-awarded badges)
                                 ├── Tags (M:M categorization)
                                 └── Integration Logs (Audit trail)
```

**[→ View Full Domain Model](docs/DOMAIN_MODEL.md)**

### Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 14, React 18, Tailwind CSS |
| **Backend** | Next.js API Routes, TypeScript 5 |
| **Database** | PostgreSQL 16, Prisma ORM 5.19 |
| **Validation** | Zod schemas with type inference |
| **Testing** | Jest, React Testing Library |
| **Containerization** | Docker, Docker Compose |
| **Observability** | Structured logging, metrics collection |
| **Event System** | In-memory EventBus (extensible to RabbitMQ/Kafka) |

**[→ View Architecture Details](docs/ARCHITECTURE.md)**

---

## 🚀 Features

### 1. Template System

Create reusable campaign blueprints with predefined tracks and actions.

```typescript
POST /api/templates
{
  "key": "21-day-mindfulness",
  "name": "21-Day Mindfulness Challenge",
  "category": "ritual",
  "trackTemplates": [
    {
      "key": "morning-meditation",
      "name": "Morning Meditation",
      "trackType": "ritual_series",
      "actionTemplates": [
        {
          "orderIndex": 1,
          "actionType": "ritual",
          "scheduledOffset": 360  // 6am on day 1
        }
      ]
    }
  ]
}

// Instantiate from template
POST /api/templates/{id}/instantiate
{
  "communityId": "community-001",
  "key": "spring-mindfulness-2025",
  "startAt": "2025-03-01T00:00:00Z",
  "endAt": "2025-03-21T23:59:59Z"
}
// ✅ Creates campaign with all tracks/actions + calculated schedules
```

**Use Cases:**
- Seasonal campaigns (quarterly challenges)
- Onboarding programs
- Recurring events
- Multi-community rollouts

### 2. Real-Time Analytics

Track campaign performance with calculated metrics.

```typescript
GET /api/analytics/campaign/{campaignId}
{
  "totalParticipants": 156,
  "activeParticipants": 142,
  "completedParticipants": 12,
  "totalActions": 63,
  "completedActions": 1247,
  "averageCompletion": 0.68,
  "engagementScore": 82.5,  // 0-100 weighted score
  "metricsJson": {
    "dailyActiveUsers": [45, 52, 58, 61, 59],
    "completionTrend": [0.1, 0.25, 0.45, 0.68]
  }
}

// Recalculate on-demand
POST /api/analytics/campaign/{campaignId}
// ✅ Refreshes all metrics
```

**Engagement Score Formula:**
```
participationRate = activeParticipants / totalParticipants
engagementScore = (participationRate × 0.4 + avgCompletion × 0.6) × 100
```

### 3. Achievement System

Automatically award badges when participants hit milestones.

**Built-in Achievement Types:**
- 🎯 **First Track Champion** - Complete first track
- 🏆 **Campaign Master** - Complete all tracks
- ⭐ **Perfect Week** - 7 consecutive days
- 🚀 **Early Adopter** - Join within 24 hours
- 🎖️ **Halfway Hero** - 50% completion

```typescript
// Automatic check on progress update
POST /api/participants/progress
// → Triggers achievementService.checkAndAwardAchievements()
// → Emits AchievementEarnedEvent
// → Sends notification to participant

GET /api/achievements?memberId=member-001
{
  "achievements": [
    {
      "title": "🎯 First Track Champion",
      "description": "Complete your first track",
      "earnedAt": "2025-03-05T14:30:00Z"
    }
  ]
}
```

**Extensible:** Add custom achievement definitions in `src/lib/services/achievement-service.ts`

### 4. Event-Driven Integration

Typed domain events power loose coupling and extensibility.

```typescript
// 15+ Event Types
eventBus.on('participant.joined', async (event) => {
  await sendWelcomeNotification(event.data.memberId);
  await activateRituals(event.data.campaignId, event.data.memberId);
});

eventBus.on('achievement.earned', async (event) => {
  await sendCongratulatoryNotification(event.data);
  await updateLeaderboard(event.data.campaignId);
});

// All events are typed
type DomainEvent =
  | CampaignCreatedEvent
  | ParticipantJoinedEvent
  | ProgressUpdatedEvent
  | AchievementEarnedEvent
  | TemplateUsedEvent
  | ... 10 more
```

**Event Types:** `src/lib/events/types.ts`

### 5. Adapter Pattern for Integrations

Swap implementations without changing business logic.

```typescript
// Define interface
interface INotificationAdapter {
  sendNotification(params): Promise<Result>;
  sendBulkNotification(recipients, params): Promise<Result[]>;
}

// Register implementation
adapterRegistry.register('notification', new SendGridAdapter());

// Use anywhere
const adapter = getNotificationAdapter();
await adapter.sendNotification({ ... });

// Swap for testing
adapterRegistry.register('notification', new MockAdapter());
```

**Available Adapters:**
- `INotificationAdapter` - Notification delivery
- `IContentAdapter` - Content scheduling
- `IRitualAdapter` - Ritual orchestration
- `IMetricsAdapter` - Metrics collection
- `IAnalyticsAdapter` - Event tracking
- `IStorageAdapter` - File storage
- `IProfileAdapter` - User profile lookup

**[→ Integration Recipes](docs/INTEGRATION_RECIPES.md)**

### 6. Comprehensive Observability

Built-in logging, metrics, and audit trails.

```typescript
// Structured logging
logger.info('Processing request', {
  campaignId: 'xxx',
  memberId: 'yyy'
});

// Metrics collection
metrics.incrementCounter(MetricNames.API_REQUEST);
metrics.recordHistogram(MetricNames.API_REQUEST_DURATION, 45);

// Integration audit trail
IntegrationLog {
  service: "notification-hub",
  operation: "send_notification",
  requestJson: "...",
  responseJson: "...",
  status: "success",
  durationMs: 45
}
```

### 7. Webhook System

External systems can subscribe to campaign events.

```typescript
POST /api/webhooks/subscribe
{
  "subscriberId": "external-service-123",
  "url": "https://external.com/webhooks",
  "events": ["participant.joined", "achievement.earned"],
  "secret": "webhook-secret"
}

// Automatic delivery on events
WebhookDelivery {
  eventType: "participant.joined",
  payloadJson: "...",
  status: "delivered",
  attemptCount: 1,
  deliveredAt: "2025-03-01T10:30:00Z"
}
```

**Retry Logic:** Exponential backoff with 5 attempts

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 20+
- **Docker** & Docker Compose
- **npm** or yarn

### Quick Start

```bash
# 1. Clone repository
git clone <repository-url>
cd festival-campaign-orchestrator

# 2. Install dependencies
npm install

# 3. Copy environment variables
cp .env.example .env

# 4. Start PostgreSQL
npm run docker:up

# 5. Push database schema
npm run db:push

# 6. Seed enhanced demo data
npm run db:seed:enhanced

# 7. Start development server
npm run dev

# 8. Open browser
open http://localhost:3000
```

### With Full Docker Stack

```bash
# Build and start everything
docker-compose up -d

# View logs
npm run docker:logs

# Stop all services
npm run docker:down
```

---

## 🔌 API Reference

### Campaigns

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/campaigns` | List campaigns with filters |
| POST | `/api/campaigns` | Create new campaign |
| GET | `/api/campaigns/:id` | Get campaign details |
| PATCH | `/api/campaigns/:id` | Update campaign |
| DELETE | `/api/campaigns/:id` | Delete campaign |

### Templates

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/templates` | List all templates |
| POST | `/api/templates` | Create template |
| GET | `/api/templates/:id` | Get template details |
| POST | `/api/templates/:id/instantiate` | Create campaign from template |
| DELETE | `/api/templates/:id` | Delete template |

### Analytics

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/analytics/campaign/:id` | Get campaign analytics |
| POST | `/api/analytics/campaign/:id` | Recalculate analytics |

### Achievements

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/achievements` | List achievements (filter by campaign/member) |

### Participants

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/participants/join` | Join campaign |
| POST | `/api/participants/progress` | Update progress (triggers achievements) |
| GET | `/api/participants/progress` | Get participant progress |

**[→ Full API Documentation](docs/API.md)**

---

## 🛠️ CLI Tool

Manage campaigns, analytics, and achievements from the command line.

```bash
# List all campaigns
npm run cli campaigns:list

# Activate a campaign
npm run cli campaigns:activate <campaignId>

# Recalculate analytics
npm run cli analytics:recalculate <campaignId>

# Check achievements for a member
npm run cli achievements:check <campaignId> <memberId>

# List all templates
npm run cli templates:list

# Show help
npm run cli help
```

---

## 📚 Documentation

| Document | Description |
|----------|-------------|
| **[ARCHITECTURE.md](docs/ARCHITECTURE.md)** | System design, patterns, scaling strategies |
| **[DOMAIN_MODEL.md](docs/DOMAIN_MODEL.md)** | Entity relationships, business rules, state machines |
| **[INTEGRATION_RECIPES.md](docs/INTEGRATION_RECIPES.md)** | Patterns for connecting with ecosystem services |
| **[PHASE3_OVERVIEW.md](docs/PHASE3_OVERVIEW.md)** | Implementation roadmap and features |

---

## 🔧 Development

### Available Scripts

```bash
npm run dev              # Start development server
npm run build            # Build for production
npm run start            # Start production server
npm run lint             # Run ESLint
npm run typecheck        # TypeScript type checking
npm run format           # Format code with Prettier
npm run format:check     # Check code formatting

npm run db:push          # Push schema to database
npm run db:migrate       # Create migration
npm run db:seed          # Basic seed data
npm run db:seed:enhanced # Rich seed with templates, analytics, achievements
npm run db:studio        # Open Prisma Studio
npm run db:reset         # Reset database

npm run test             # Run tests
npm run test:watch       # Run tests in watch mode
npm run test:coverage    # Generate coverage report

npm run docker:up        # Start Docker services
npm run docker:down      # Stop Docker services
npm run docker:build     # Build Docker images
npm run docker:logs      # View Docker logs
```

### Project Structure

```
festival-campaign-orchestrator/
├── docs/                    # Documentation
│   ├── ARCHITECTURE.md
│   ├── DOMAIN_MODEL.md
│   ├── INTEGRATION_RECIPES.md
│   └── PHASE3_OVERVIEW.md
├── prisma/
│   ├── schema.prisma        # 15+ domain entities
│   ├── seed.ts              # Basic seed
│   └── seed-enhanced.ts     # Rich demo data
├── src/
│   ├── app/
│   │   ├── api/             # API routes
│   │   │   ├── campaigns/
│   │   │   ├── templates/
│   │   │   ├── analytics/
│   │   │   ├── achievements/
│   │   │   └── participants/
│   │   ├── campaigns/[id]/  # Campaign detail page
│   │   ├── member/[id]/     # Member progress page
│   │   └── page.tsx         # Homepage
│   ├── lib/
│   │   ├── adapters/        # Integration adapters
│   │   │   ├── types.ts
│   │   │   ├── registry.ts
│   │   │   └── implementations/
│   │   ├── events/          # Event system
│   │   │   ├── types.ts     # 15+ typed events
│   │   │   └── event-bus.ts
│   │   ├── services/        # Business logic
│   │   │   ├── achievement-service.ts
│   │   │   └── scheduler.ts
│   │   ├── logger.ts        # Structured logging
│   │   ├── metrics.ts       # Metrics collection
│   │   ├── prisma.ts
│   │   ├── validations.ts
│   │   └── api-utils.ts
│   ├── types/
│   │   └── festival.ts
│   ├── cli/
│   │   └── index.ts         # CLI tool
│   └── __tests__/
├── docker-compose.yml
├── Dockerfile
└── package.json
```

### Testing

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage
```

**Test Coverage:**
- Validation schemas
- API utilities
- Service layer
- Integration flows

---

## 🚢 Deployment

### Environment Variables

```bash
# Database
DATABASE_URL="postgresql://user:pass@localhost:5432/festival_campaigns"

# External services
CONTENT_CALENDAR_URL="http://content-calendar:3001"
NOTIFICATION_HUB_URL="http://notification-hub:3002"
RITUAL_ORCHESTRATOR_URL="http://ritual-orchestrator:3003"

# Logging
LOG_LEVEL="info"  # debug | info | warn | error

# Node
NODE_ENV="production"
```

### Docker Production Deployment

```bash
# Build image
docker build -t festival-campaign-orchestrator:latest .

# Run with environment variables
docker run -d \
  -p 3000:3000 \
  --env-file .env \
  --name festival-orchestrator \
  festival-campaign-orchestrator:latest
```

### Database Migrations

```bash
# Development
npm run db:migrate

# Production
npm run db:migrate:deploy
```

---

## 📊 Demo Data

The enhanced seed creates:

- **2 Campaign Templates**
  - 21-Day Mindfulness Challenge
  - 30-Day Fitness Journey

- **2 Live Campaigns**
  - Spring Awakening Festival 2025 (active, with participants)
  - Summer Mindfulness Retreat (upcoming)

- **10 Participants** with varied progress
- **Campaign Analytics** with real metrics
- **Achievements** for early adopters
- **Integration Logs** showing service calls
- **4 Tags** for categorization

```bash
npm run db:seed:enhanced
```

Then visit:
- **Homepage**: http://localhost:3000
- **Campaign Detail**: http://localhost:3000/campaigns/{id}
- **Member Progress**: http://localhost:3000/member/member-001

---

## 🚦 Future Enhancements

### Phase 4 Roadmap

- [ ] **Real-time Updates** - WebSocket integration for live progress
- [ ] **Advanced Analytics** - Cohort analysis, retention curves, funnel tracking
- [ ] **Social Features** - Leaderboards, teams, social sharing
- [ ] **Admin Dashboard** - Campaign management UI with drag-and-drop
- [ ] **A/B Testing** - Campaign variations and performance comparison
- [ ] **Automated Rewards** - Point systems, virtual currencies, items
- [ ] **Email/SMS Channels** - Multi-channel notification delivery
- [ ] **Export & Reporting** - PDF reports, CSV exports, data warehousing
- [ ] **Internationalization** - Multi-language campaigns and content
- [ ] **Mobile SDK** - React Native integration library
- [ ] **GraphQL API** - Alternative API layer for flexible queries
- [ ] **Redis Caching** - Performance optimization for hot data
- [ ] **Background Jobs** - Queue-based async processing (Bull/BullMQ)
- [ ] **Rate Limiting** - API protection and quota management

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes with tests
4. Run linting and tests (`npm run lint && npm test`)
5. Commit with conventional commits (`git commit -m 'feat: Add amazing feature'`)
6. Push to your branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

**Commit Convention:**
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation
- `refactor:` - Code refactoring
- `test:` - Test additions
- `chore:` - Maintenance

---

## 📝 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

Built with modern TypeScript, Next.js, and Prisma to demonstrate production-ready patterns for:
- Event-driven architecture
- Domain-Driven Design
- Multi-system orchestration
- Extensible plugin systems
- Real-time analytics
- Achievement systems

**Perfect for:**
- Community engagement platforms
- EdTech applications
- Fitness and wellness apps
- Corporate training programs
- Gamification systems
- Festival and event management

---

## 📞 Support

- **Documentation**: [docs/](docs/)
- **Issues**: [GitHub Issues](https://github.com/your-org/festival-campaign-orchestrator/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-org/festival-campaign-orchestrator/discussions)

---

**Built with ❤️ for community engagement and festival celebrations! 🎉**

*Production-ready. Extensible. Event-driven. Type-safe.*
