# Integration Recipes

This guide provides practical recipes for integrating the Festival Campaign Orchestrator with other services in your ecosystem.

## Table of Contents

1. [Authentication & Authorization](#authentication--authorization)
2. [Notification Hub Integration](#notification-hub-integration)
3. [Content Calendar Integration](#content-calendar-integration)
4. [Ritual Orchestrator Integration](#ritual-orchestrator-integration)
5. [Analytics Platform Integration](#analytics-platform-integration)
6. [Webhook Consumers](#webhook-consumers)
7. [Event-Driven Integration](#event-driven-integration)

---

## Authentication & Authorization

### With API Gateway

Place an API gateway (Kong, AWS API Gateway, etc.) in front of the orchestrator:

```yaml
# Kong route configuration
routes:
  - name: festival-campaigns
    paths:
      - /campaigns
    service: festival-orchestrator
    plugins:
      - name: jwt
        config:
          secret_is_base64: false
          claims_to_verify:
            - exp
      - name: acl
        config:
          whitelist:
            - campaign-admin
            - campaign-viewer
```

### With Next.js Middleware

```typescript
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.headers.get('authorization');

  if (!token) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  // Verify JWT token with your auth service
  const user = await verifyToken(token);

  // Add user context to headers
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-user-id', user.id);
  requestHeaders.set('x-user-role', user.role);

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: '/api/:path*',
};
```

---

## Notification Hub Integration

### Implementing Real Notification Adapter

```typescript
// src/lib/adapters/implementations/sendgrid-adapter.ts
import sgMail from '@sendgrid/mail';
import { INotificationAdapter, SendNotificationParams } from '../types';

export class SendGridNotificationAdapter implements INotificationAdapter {
  constructor(apiKey: string) {
    sgMail.setApiKey(apiKey);
  }

  async sendNotification(params: SendNotificationParams) {
    try {
      await sgMail.send({
        to: await this.getEmailForUser(params.recipientId),
        from: 'notifications@yourapp.com',
        subject: params.title,
        text: params.body,
        html: `<p>${params.body}</p>`,
      });

      return {
        success: true,
        notificationId: `sg-${Date.now()}`,
        sentAt: new Date(),
      };
    } catch (error) {
      return {
        success: false,
        notificationId: '',
        sentAt: new Date(),
        error: error.message,
      };
    }
  }

  private async getEmailForUser(userId: string): Promise<string> {
    // Fetch from your user service
    const response = await fetch(`${process.env.USER_SERVICE_URL}/users/${userId}`);
    const user = await response.json();
    return user.email;
  }
}

// Register it
import { adapterRegistry } from '@/lib/adapters';
const sendgridAdapter = new SendGridNotificationAdapter(process.env.SENDGRID_API_KEY!);
adapterRegistry.register('notification', sendgridAdapter);
```

### Webhook Integration

```typescript
// Your notification service calls this webhook
POST /api/webhooks/notification-status
{
  "notificationId": "notif-123",
  "status": "delivered",
  "deliveredAt": "2025-03-01T10:30:00Z"
}

// Handler
export async function POST(request: NextRequest) {
  const { notificationId, status, deliveredAt } = await request.json();

  await prisma.notificationLog.update({
    where: { notificationId },
    data: {
      status,
      sentAt: new Date(deliveredAt),
    },
  });

  return NextResponse.json({ success: true });
}
```

---

## Content Calendar Integration

### Bidirectional Sync

```typescript
// When content is published in calendar, notify orchestrator
POST /api/webhooks/content-published
{
  "contentCalendarId": "cc-123",
  "campaignId": "campaign-456",
  "publishedAt": "2025-03-01T09:00:00Z"
}

// Handler updates action status
export async function POST(request: NextRequest) {
  const { contentCalendarId, campaignId, publishedAt } = await request.json();

  // Find action with this content calendar ID
  const action = await prisma.festivalAction.findFirst({
    where: {
      externalRefJson: {
        contains: contentCalendarId,
      },
    },
  });

  if (action) {
    await prisma.festivalAction.update({
      where: { id: action.id },
      data: { status: 'completed' },
    });
  }

  return NextResponse.json({ success: true });
}
```

---

## Ritual Orchestrator Integration

### Syncing Ritual Completions

```typescript
// Ritual orchestrator reports completion
POST /api/webhooks/ritual-completed
{
  "ritualScheduleId": "sched-123",
  "memberId": "member-001",
  "completedAt": "2025-03-01T06:30:00Z",
  "metadata": {
    "duration": 600,
    "quality": "excellent"
  }
}

// Auto-update participant progress
export async function POST(request: NextRequest) {
  const { ritualScheduleId, memberId, completedAt, metadata } = await request.json();

  // Find the action associated with this ritual
  const action = await prisma.festivalAction.findFirst({
    where: {
      externalRefJson: {
        contains: ritualScheduleId,
      },
    },
    include: {
      track: true,
    },
  });

  if (action) {
    // Update progress
    await updateProgress({
      campaignId: action.track.campaignId,
      memberId,
      actionId: action.id,
      completed: true,
      data: metadata,
    });
  }

  return NextResponse.json({ success: true });
}
```

---

## Analytics Platform Integration

### Streaming Events to Analytics

```typescript
// src/lib/adapters/implementations/segment-adapter.ts
import Analytics from 'analytics-node';
import { IAnalyticsAdapter, TrackEventParams } from '../types';

export class SegmentAnalyticsAdapter implements IAnalyticsAdapter {
  private client: Analytics;

  constructor(writeKey: string) {
    this.client = new Analytics(writeKey);
  }

  async trackEvent(params: TrackEventParams) {
    this.client.track({
      userId: params.userId,
      event: params.eventName,
      properties: params.properties,
      timestamp: params.timestamp,
    });
  }

  async identifyUser(userId: string, traits?: Record<string, unknown>) {
    this.client.identify({
      userId,
      traits,
    });
  }

  async trackPageView(path: string, userId?: string) {
    this.client.page({
      userId,
      name: path,
    });
  }
}

// Register and use
adapterRegistry.register('analytics', new SegmentAnalyticsAdapter(process.env.SEGMENT_WRITE_KEY!));

// Subscribe to events and forward
eventBus.onAll(async (event) => {
  const analytics = getAnalyticsAdapter();
  if (analytics) {
    await analytics.trackEvent({
      eventName: `festival.${event.type}`,
      properties: event.data,
      timestamp: event.timestamp,
    });
  }
});
```

---

## Webhook Consumers

### Subscribing to Campaign Events

```typescript
// External service subscribes
POST /api/webhooks/subscribe
{
  "subscriberId": "external-service-123",
  "url": "https://external-service.com/webhooks/festival-events",
  "events": ["campaign.created", "participant.joined", "achievement.earned"],
  "secret": "webhook-secret-key"
}

// Orchestrator delivers events
eventBus.on('campaign.created', async (event) => {
  const subscriptions = await prisma.webhookSubscription.findMany({
    where: {
      isActive: true,
      events: {
        contains: 'campaign.created',
      },
    },
  });

  for (const subscription of subscriptions) {
    await deliverWebhook(subscription, event);
  }
});

async function deliverWebhook(subscription, event) {
  const payload = {
    event: event.type,
    data: event.data,
    timestamp: event.timestamp,
  };

  const signature = createHmacSignature(payload, subscription.secret);

  try {
    const response = await fetch(subscription.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Signature': signature,
      },
      body: JSON.stringify(payload),
    });

    await prisma.webhookDelivery.create({
      data: {
        subscriptionId: subscription.id,
        eventType: event.type,
        payloadJson: JSON.stringify(payload),
        status: response.ok ? 'delivered' : 'failed',
        statusCode: response.status,
        deliveredAt: response.ok ? new Date() : null,
      },
    });
  } catch (error) {
    // Handle retry logic
  }
}
```

---

## Event-Driven Integration

### Using Message Queue (RabbitMQ/AWS SQS)

```typescript
// src/lib/events/queue-publisher.ts
import amqp from 'amqplib';

export class QueueEventPublisher {
  private connection: amqp.Connection;
  private channel: amqp.Channel;

  async connect() {
    this.connection = await amqp.connect(process.env.RABBITMQ_URL!);
    this.channel = await this.connection.createChannel();
    await this.channel.assertExchange('festival-events', 'topic', { durable: true });
  }

  async publishEvent(event: DomainEvent) {
    const routingKey = event.type.replace('.', '-');
    this.channel.publish(
      'festival-events',
      routingKey,
      Buffer.from(JSON.stringify(event)),
      { persistent: true }
    );
  }
}

// Initialize on startup
const queuePublisher = new QueueEventPublisher();
await queuePublisher.connect();

// Forward all events to queue
eventBus.onAll(async (event) => {
  await queuePublisher.publishEvent(event);
});
```

### Consuming from Another Service

```typescript
// Consumer service
import amqp from 'amqplib';

async function startConsumer() {
  const connection = await amqp.connect(process.env.RABBITMQ_URL);
  const channel = await connection.createChannel();

  await channel.assertExchange('festival-events', 'topic', { durable: true });
  const queue = await channel.assertQueue('analytics-processor', { durable: true });

  // Subscribe to specific events
  await channel.bindQueue(queue.queue, 'festival-events', 'participant-joined');
  await channel.bindQueue(queue.queue, 'festival-events', 'progress-updated');

  channel.consume(queue.queue, async (msg) => {
    if (msg) {
      const event = JSON.parse(msg.content.toString());
      await processEvent(event);
      channel.ack(msg);
    }
  });
}
```

---

## GraphQL Federation

### Extending with GraphQL

```typescript
// schema.graphql
extend type User @key(fields: "id") {
  id: ID! @external
  festivalParticipations: [FestivalParticipation!]!
  achievements: [Achievement!]!
}

type FestivalParticipation {
  campaign: Campaign!
  joinedAt: DateTime!
  progress: ParticipationProgress!
  status: ParticipationStatus!
}

// Resolver
export const resolvers = {
  User: {
    festivalParticipations: async (user) => {
      return await prisma.participantFestivalState.findMany({
        where: { memberId: user.id },
        include: { campaign: true },
      });
    },
    achievements: async (user) => {
      return await prisma.memberAchievement.findMany({
        where: { memberId: user.id },
      });
    },
  },
};
```

---

## Best Practices

1. **Use Idempotency Keys** for webhook deliveries
2. **Implement Retry Logic** with exponential backoff
3. **Version Your APIs** to avoid breaking changes
4. **Log All Integration Calls** for debugging
5. **Monitor Integration Health** with metrics
6. **Use Circuit Breakers** to prevent cascading failures
7. **Validate Webhook Signatures** for security
8. **Handle Timeouts Gracefully** with fallbacks

---

## Testing Integrations

### Mock Adapters for Tests

```typescript
// tests/mocks/mock-notification-adapter.ts
export class MockNotificationAdapter implements INotificationAdapter {
  public sentNotifications: SendNotificationParams[] = [];

  async sendNotification(params: SendNotificationParams) {
    this.sentNotifications.push(params);
    return {
      success: true,
      notificationId: `mock-${Date.now()}`,
      sentAt: new Date(),
    };
  }
}

// In tests
beforeEach(() => {
  const mockAdapter = new MockNotificationAdapter();
  adapterRegistry.register('notification', mockAdapter);
});
```

### Integration Test Example

```typescript
describe('Participant Join Flow', () => {
  it('should send welcome notification when joining', async () => {
    const mockAdapter = new MockNotificationAdapter();
    adapterRegistry.register('notification', mockAdapter);

    await POST('/api/participants/join', {
      campaignId: 'test-campaign',
      memberId: 'test-member',
    });

    expect(mockAdapter.sentNotifications).toHaveLength(1);
    expect(mockAdapter.sentNotifications[0].type).toBe('campaign_start');
  });
});
```
