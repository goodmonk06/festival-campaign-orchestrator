# 🎉 Festival Campaign Orchestrator

A comprehensive TypeScript/Next.js system for orchestrating **festival-style campaigns** with time-bounded events, challenges, rewards, rituals, and content coordination.

## 🎯 Concept

Festival Campaign Orchestrator coordinates multi-system festival campaigns that include:
- **Time-bounded events** with defined start and end dates
- **Multiple tracks** (challenges, ritual series, content series)
- **Actions** (quests, rituals, posts, live sessions)
- **Participant management** with progress tracking
- **Integration stubs** for external systems (notifications, content calendar, ritual orchestrator)

## 🏗️ Architecture

### Domain Model

```
FestivalCampaign
├── id, communityId, key, name
├── descriptionMarkdown
├── startAt, endAt
├── themeTagsJson
└── tracks[] → FestivalTrack
    ├── id, key, name
    ├── trackType (challenge | ritual_series | content_series)
    ├── metaJson
    └── actions[] → FestivalAction
        ├── id, orderIndex
        ├── actionType (quest | ritual | post | live_session)
        ├── externalRefJson
        └── scheduledAt

ParticipantFestivalState
├── campaignId, memberId
├── joinedAt
├── progressJson
└── lastUpdatedAt
```

### Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL
- **ORM**: Prisma
- **UI**: React with Tailwind CSS
- **Validation**: Zod
- **Testing**: Jest
- **Containerization**: Docker & Docker Compose

## 🚀 Getting Started

### Prerequisites

- Node.js 20+
- Docker & Docker Compose (for local database)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd festival-campaign-orchestrator
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```

4. **Start the database**
   ```bash
   npm run docker:up
   ```

5. **Push database schema**
   ```bash
   npm run db:push
   ```

6. **Seed demo data**
   ```bash
   npm run db:seed
   ```

7. **Start development server**
   ```bash
   npm run dev
   ```

8. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📚 Features

### 1. Campaign Modeling

Create comprehensive festival campaigns with multiple tracks and actions:

```typescript
POST /api/campaigns
{
  "communityId": "community-001",
  "key": "spring-awakening-2025",
  "name": "Spring Awakening Festival 2025",
  "descriptionMarkdown": "# Spring Festival\n\nJoin us!",
  "startAt": "2025-03-01T00:00:00Z",
  "endAt": "2025-03-31T23:59:59Z",
  "themeTagsJson": ["spring", "mindfulness", "growth"]
}
```

### 2. Track Management

Organize campaigns into tracks with different types:

- **Challenge Tracks**: Point-based quests with achievements
- **Ritual Series**: Daily/weekly recurring activities
- **Content Series**: Scheduled articles, videos, live sessions

```typescript
POST /api/tracks
{
  "campaignId": "campaign-id",
  "key": "morning-rituals",
  "name": "Morning Ritual Challenge",
  "trackType": "ritual_series",
  "metaJson": {
    "frequency": "daily",
    "requiredCompletions": 21
  }
}
```

### 3. Action Scheduling

Schedule individual actions within tracks:

```typescript
POST /api/actions
{
  "trackId": "track-id",
  "orderIndex": 1,
  "actionType": "live_session",
  "externalRefJson": {
    "sessionId": "live-001",
    "sessionTitle": "Spring Equinox Celebration",
    "duration": 90
  },
  "scheduledAt": "2025-03-20T18:00:00Z"
}
```

### 4. Participant Flow

**Join a campaign:**
```typescript
POST /api/participants/join
{
  "campaignId": "campaign-id",
  "memberId": "member-123"
}
```

**Update progress:**
```typescript
POST /api/participants/progress
{
  "campaignId": "campaign-id",
  "memberId": "member-123",
  "actionId": "action-id",
  "completed": true,
  "data": { "score": 100 }
}
```

**View progress:**
```typescript
GET /api/participants/progress?campaignId=xxx&memberId=yyy
```

### 5. Integration Stubs

The system includes stub integrations for external services that would be called during campaign orchestration:

#### Content Calendar
- Schedule posts and articles
- Cancel scheduled content
- Located at: `src/lib/integrations/content-calendar.ts`

#### Notification Hub
- Send participant notifications
- Schedule reminders
- Bulk notifications
- Located at: `src/lib/integrations/notification-hub.ts`

#### Ritual Orchestrator
- Activate ritual schedules
- Record completions
- Track streaks
- Located at: `src/lib/integrations/ritual-orchestrator.ts`

### 6. UI Components

**Campaign Overview**
- View all campaigns (active, upcoming, past)
- Browse campaign details with tracks and actions
- See participant counts and schedules

**Member Progress Dashboard**
- Track completion across all joined campaigns
- Visual progress bars
- Action-level completion details

## 🔄 Multi-System Event Flows

### Campaign Launch Flow

```
1. Campaign created → scheduleCampaignActions()
2. For each action:
   - Posts → scheduleContent() to Content Calendar
   - Live Sessions → scheduleNotification() for reminders
   - Quests → scheduleNotification() for availability
   - Rituals → Activated on participant join
```

### Participant Join Flow

```
1. Member joins campaign → onParticipantJoin()
2. Welcome notification → sendNotification()
3. Ritual series activation → activateRitual() for each ritual track
4. Progress state initialized with empty progress JSON
```

### Progress Update Flow

```
1. External system reports completion (or manual update)
2. Update participant progress JSON
3. Track completion counts per track
4. Calculate overall campaign progress
```

## 📁 Project Structure

```
festival-campaign-orchestrator/
├── prisma/
│   ├── schema.prisma          # Database schema
│   └── seed.ts                # Demo data seeder
├── src/
│   ├── app/
│   │   ├── api/               # API routes
│   │   │   ├── campaigns/     # Campaign CRUD
│   │   │   ├── tracks/        # Track management
│   │   │   ├── actions/       # Action management
│   │   │   └── participants/  # Join & progress APIs
│   │   ├── campaigns/[id]/    # Campaign detail page
│   │   ├── member/[memberId]/ # Member progress page
│   │   ├── layout.tsx
│   │   ├── page.tsx           # Campaign list homepage
│   │   └── globals.css
│   ├── lib/
│   │   ├── integrations/      # External service stubs
│   │   │   ├── content-calendar.ts
│   │   │   ├── notification-hub.ts
│   │   │   └── ritual-orchestrator.ts
│   │   ├── services/
│   │   │   └── scheduler.ts   # Campaign orchestration logic
│   │   ├── prisma.ts          # Prisma client
│   │   ├── validations.ts     # Zod schemas
│   │   └── api-utils.ts       # Response helpers
│   ├── types/
│   │   └── festival.ts        # TypeScript types
│   └── __tests__/             # Jest tests
├── docker-compose.yml         # PostgreSQL container
├── Dockerfile                 # App containerization
├── package.json
├── tsconfig.json
└── README.md
```

## 🧪 Testing

Run tests:
```bash
npm test
```

Run tests in watch mode:
```bash
npm run test:watch
```

Tests cover:
- Validation schemas (Zod)
- API utilities
- Core business logic

## 🐳 Docker

**Start services:**
```bash
npm run docker:up
```

**Stop services:**
```bash
npm run docker:down
```

**Build and run the app container:**
```bash
docker build -t festival-campaign-orchestrator .
docker run -p 3000:3000 --env-file .env festival-campaign-orchestrator
```

## 📊 Database

**View data with Prisma Studio:**
```bash
npm run db:studio
```

**Create migration:**
```bash
npm run db:migrate
```

**Push schema changes:**
```bash
npm run db:push
```

## 🔌 API Reference

### Campaigns

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/campaigns` | List campaigns (with filters) |
| POST | `/api/campaigns` | Create campaign |
| GET | `/api/campaigns/:id` | Get campaign details |
| PATCH | `/api/campaigns/:id` | Update campaign |
| DELETE | `/api/campaigns/:id` | Delete campaign |

### Tracks

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/tracks` | Create track |
| GET | `/api/tracks/:id` | Get track details |
| PATCH | `/api/tracks/:id` | Update track |
| DELETE | `/api/tracks/:id` | Delete track |

### Actions

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/actions` | Create action |
| GET | `/api/actions/:id` | Get action details |
| PATCH | `/api/actions/:id` | Update action |
| DELETE | `/api/actions/:id` | Delete action |

### Participants

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/participants/join` | Join campaign |
| POST | `/api/participants/progress` | Update progress |
| GET | `/api/participants/progress` | Get participant progress |

## 🎨 Demo Campaign

The seed script creates a comprehensive demo: **"Spring Awakening Festival 2025"**

**Includes:**
- 3 tracks (Morning Rituals, Creative Challenge, Wisdom Series)
- 10+ actions across different types
- 2 demo participants with sample progress

Run: `npm run db:seed`

## 🚦 Future Enhancements

- [ ] Real-time progress updates via WebSockets
- [ ] Analytics dashboard for campaign performance
- [ ] Automated reward distribution
- [ ] Social features (leaderboards, sharing)
- [ ] Admin UI for campaign management
- [ ] Integration with real external services
- [ ] Email/SMS notification channels
- [ ] Export progress reports
- [ ] Multi-language support
- [ ] Mobile app integration

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

Built with modern TypeScript, Next.js, and Prisma to demonstrate multi-system orchestration patterns for festival-style community engagement campaigns.

---

**Built with ❤️ for community engagement and festival celebrations! 🎉**
