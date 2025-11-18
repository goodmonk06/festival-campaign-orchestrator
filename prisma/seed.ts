import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌸 Starting seed...');

  // Clean existing data
  await prisma.participantFestivalState.deleteMany();
  await prisma.festivalAction.deleteMany();
  await prisma.festivalTrack.deleteMany();
  await prisma.festivalCampaign.deleteMany();

  // Create demo festival campaign: "Spring Awakening Festival 2025"
  const campaign = await prisma.festivalCampaign.create({
    data: {
      communityId: 'community-001',
      key: 'spring-awakening-2025',
      name: 'Spring Awakening Festival 2025',
      descriptionMarkdown: `# 🌸 Spring Awakening Festival

Join us for a month-long celebration of renewal, growth, and community connection!

## What to Expect
- Daily mindfulness rituals
- Creative challenges
- Exclusive content series
- Live sessions with community leaders

Let's bloom together this spring! 🌱`,
      startAt: new Date('2025-03-01T00:00:00Z'),
      endAt: new Date('2025-03-31T23:59:59Z'),
      themeTagsJson: JSON.stringify(['spring', 'mindfulness', 'growth', 'community']),
    },
  });

  console.log(`✅ Created campaign: ${campaign.name}`);

  // Track 1: Morning Ritual Challenge
  const ritualTrack = await prisma.festivalTrack.create({
    data: {
      campaignId: campaign.id,
      key: 'morning-rituals',
      name: '🌅 Morning Ritual Challenge',
      descriptionMarkdown: 'Complete 21 days of morning rituals to build lasting habits.',
      trackType: 'ritual_series',
      metaJson: JSON.stringify({
        frequency: 'daily',
        requiredCompletions: 21,
      }),
      actions: {
        create: [
          {
            orderIndex: 1,
            actionType: 'ritual',
            externalRefJson: JSON.stringify({
              ritualId: 'ritual-morning-meditation',
              ritualKey: 'morning-meditation',
              frequency: 'daily',
            }),
            scheduledAt: new Date('2025-03-01T06:00:00Z'),
          },
          {
            orderIndex: 2,
            actionType: 'ritual',
            externalRefJson: JSON.stringify({
              ritualId: 'ritual-gratitude-journal',
              ritualKey: 'gratitude-journal',
              frequency: 'daily',
            }),
            scheduledAt: new Date('2025-03-01T07:00:00Z'),
          },
          {
            orderIndex: 3,
            actionType: 'ritual',
            externalRefJson: JSON.stringify({
              ritualId: 'ritual-movement',
              ritualKey: 'morning-movement',
              frequency: 'daily',
            }),
            scheduledAt: new Date('2025-03-01T07:30:00Z'),
          },
        ],
      },
    },
  });

  console.log(`✅ Created track: ${ritualTrack.name}`);

  // Track 2: Creative Expression Challenge
  const challengeTrack = await prisma.festivalTrack.create({
    data: {
      campaignId: campaign.id,
      key: 'creative-challenge',
      name: '🎨 Creative Expression Challenge',
      descriptionMarkdown: 'Complete quests to unlock your creative potential.',
      trackType: 'challenge',
      metaJson: JSON.stringify({
        points: 1000,
        difficulty: 'medium',
        badge: 'creative-master',
      }),
      actions: {
        create: [
          {
            orderIndex: 1,
            actionType: 'quest',
            externalRefJson: JSON.stringify({
              questId: 'quest-write-poem',
              questKey: 'write-spring-poem',
            }),
            scheduledAt: new Date('2025-03-05T00:00:00Z'),
          },
          {
            orderIndex: 2,
            actionType: 'quest',
            externalRefJson: JSON.stringify({
              questId: 'quest-photo-story',
              questKey: 'spring-photo-story',
            }),
            scheduledAt: new Date('2025-03-12T00:00:00Z'),
          },
          {
            orderIndex: 3,
            actionType: 'quest',
            externalRefJson: JSON.stringify({
              questId: 'quest-share-art',
              questKey: 'share-your-art',
            }),
            scheduledAt: new Date('2025-03-19T00:00:00Z'),
          },
        ],
      },
    },
  });

  console.log(`✅ Created track: ${challengeTrack.name}`);

  // Track 3: Wisdom Content Series
  const contentTrack = await prisma.festivalTrack.create({
    data: {
      campaignId: campaign.id,
      key: 'wisdom-series',
      name: '📚 Spring Wisdom Series',
      descriptionMarkdown: 'Curated content to inspire and guide your spring journey.',
      trackType: 'content_series',
      metaJson: JSON.stringify({
        category: 'educational',
        format: 'article',
      }),
      actions: {
        create: [
          {
            orderIndex: 1,
            actionType: 'post',
            externalRefJson: JSON.stringify({
              contentId: 'post-spring-renewal',
              contentType: 'article',
              topic: 'The Art of Renewal',
            }),
            scheduledAt: new Date('2025-03-01T09:00:00Z'),
          },
          {
            orderIndex: 2,
            actionType: 'post',
            externalRefJson: JSON.stringify({
              contentId: 'post-mindful-growth',
              contentType: 'article',
              topic: 'Mindful Growth Practices',
            }),
            scheduledAt: new Date('2025-03-08T09:00:00Z'),
          },
          {
            orderIndex: 3,
            actionType: 'live_session',
            externalRefJson: JSON.stringify({
              sessionId: 'live-spring-celebration',
              sessionTitle: 'Spring Equinox Celebration',
              duration: 90,
            }),
            scheduledAt: new Date('2025-03-20T18:00:00Z'),
          },
          {
            orderIndex: 4,
            actionType: 'post',
            externalRefJson: JSON.stringify({
              contentId: 'post-festival-reflection',
              contentType: 'article',
              topic: 'Reflecting on Your Journey',
            }),
            scheduledAt: new Date('2025-03-29T09:00:00Z'),
          },
        ],
      },
    },
  });

  console.log(`✅ Created track: ${contentTrack.name}`);

  // Create some demo participants
  const participant1 = await prisma.participantFestivalState.create({
    data: {
      campaignId: campaign.id,
      memberId: 'member-001',
      progressJson: JSON.stringify({
        tracks: [
          {
            trackId: ritualTrack.id,
            actions: [
              {
                actionId: 'action-1',
                completed: true,
                completedAt: '2025-03-01T06:30:00Z',
              },
            ],
          },
        ],
        totalActionsCompleted: 1,
        lastActivityAt: '2025-03-01T06:30:00Z',
      }),
    },
  });

  const participant2 = await prisma.participantFestivalState.create({
    data: {
      campaignId: campaign.id,
      memberId: 'member-002',
      progressJson: JSON.stringify({
        tracks: [],
        totalActionsCompleted: 0,
      }),
    },
  });

  console.log(`✅ Created ${2} demo participants`);
  console.log('\n🎉 Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
