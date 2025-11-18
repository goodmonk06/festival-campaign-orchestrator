import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌸 Starting enhanced seed...');

  // Clean existing data
  console.log('Cleaning existing data...');
  await prisma.webhookDelivery.deleteMany();
  await prisma.webhookSubscription.deleteMany();
  await prisma.integrationLog.deleteMany();
  await prisma.notificationLog.deleteMany();
  await prisma.campaignTagRelation.deleteMany();
  await prisma.campaignTag.deleteMany();
  await prisma.memberAchievement.deleteMany();
  await prisma.campaignAnalytics.deleteMany();
  await prisma.participantFestivalState.deleteMany();
  await prisma.festivalAction.deleteMany();
  await prisma.festivalTrack.deleteMany();
  await prisma.festivalCampaign.deleteMany();
  await prisma.actionTemplate.deleteMany();
  await prisma.trackTemplate.deleteMany();
  await prisma.campaignTemplate.deleteMany();

  // Create Campaign Tags
  console.log('\n📌 Creating tags...');
  const tags = await Promise.all([
    prisma.campaignTag.create({
      data: {
        key: 'mindfulness',
        name: 'Mindfulness',
        description: 'Focused on meditation and present awareness',
        color: '#8B5CF6',
      },
    }),
    prisma.campaignTag.create({
      data: {
        key: 'fitness',
        name: 'Fitness',
        description: 'Physical health and exercise',
        color: '#EF4444',
      },
    }),
    prisma.campaignTag.create({
      data: {
        key: 'creativity',
        name: 'Creativity',
        description: 'Artistic expression and creative projects',
        color: '#F59E0B',
      },
    }),
    prisma.campaignTag.create({
      data: {
        key: 'community',
        name: 'Community',
        description: 'Building connections and relationships',
        color: '#10B981',
      },
    }),
  ]);
  console.log(`✅ Created ${tags.length} tags`);

  // Create Campaign Templates
  console.log('\n📝 Creating campaign templates...');

  const mindfulnessTemplate = await prisma.campaignTemplate.create({
    data: {
      key: '21-day-mindfulness',
      name: '21-Day Mindfulness Challenge',
      descriptionMarkdown: `# 21-Day Mindfulness Challenge

Transform your daily routine with consistent mindfulness practices.

## What You'll Gain
- Daily meditation practice
- Improved focus and calm
- Better stress management
- Community support

Perfect for beginners and experienced practitioners alike!`,
      category: 'ritual',
      isPublic: true,
      createdBy: 'system',
      trackTemplates: {
        create: [
          {
            key: 'morning-meditation',
            name: '🌅 Morning Meditation',
            descriptionMarkdown: 'Start each day with guided meditation',
            trackType: 'ritual_series',
            metaJson: JSON.stringify({ frequency: 'daily', duration: '10 minutes' }),
            orderIndex: 0,
            actionTemplates: {
              create: [
                {
                  orderIndex: 1,
                  actionType: 'ritual',
                  externalRefJson: JSON.stringify({
                    ritualId: 'ritual-meditation',
                    ritualKey: 'morning-meditation',
                    frequency: 'daily',
                  }),
                  scheduledOffset: 360, // 6am (360 minutes from midnight)
                },
              ],
            },
          },
          {
            key: 'gratitude-journal',
            name: '📔 Gratitude Journaling',
            descriptionMarkdown: 'Write three things you're grateful for',
            trackType: 'ritual_series',
            metaJson: JSON.stringify({ frequency: 'daily' }),
            orderIndex: 1,
            actionTemplates: {
              create: [
                {
                  orderIndex: 1,
                  actionType: 'ritual',
                  externalRefJson: JSON.stringify({
                    ritualId: 'ritual-gratitude',
                    ritualKey: 'gratitude-journal',
                    frequency: 'daily',
                  }),
                  scheduledOffset: 1260, // 9pm
                },
              ],
            },
          },
        ],
      },
    },
  });

  const fitnessTemplate = await prisma.campaignTemplate.create({
    data: {
      key: '30-day-fitness',
      name: '30-Day Fitness Journey',
      descriptionMarkdown: `# 30-Day Fitness Journey

Get moving with a progressive fitness challenge!`,
      category: 'challenge',
      isPublic: true,
      trackTemplates: {
        create: [
          {
            key: 'cardio-challenge',
            name: '💪 Cardio Challenge',
            descriptionMarkdown: 'Progressive cardio workouts',
            trackType: 'challenge',
            metaJson: JSON.stringify({ points: 500, difficulty: 'medium' }),
            orderIndex: 0,
            actionTemplates: {
              create: [
                {
                  orderIndex: 1,
                  actionType: 'quest',
                  externalRefJson: JSON.stringify({
                    questId: 'quest-cardio-1',
                    questKey: 'week-1-cardio',
                  }),
                  scheduledOffset: 0,
                },
                {
                  orderIndex: 2,
                  actionType: 'quest',
                  externalRefJson: JSON.stringify({
                    questId: 'quest-cardio-2',
                    questKey: 'week-2-cardio',
                  }),
                  scheduledOffset: 10080, // 1 week in minutes
                },
              ],
            },
          },
        ],
      },
    },
  });

  console.log(`✅ Created 2 campaign templates`);

  // Create Campaigns
  console.log('\n🎉 Creating campaigns...');

  // Active Campaign: Spring Awakening
  const springCampaign = await prisma.festivalCampaign.create({
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
      status: 'active',
      tracks: {
        create: [
          {
            key: 'morning-rituals',
            name: '🌅 Morning Ritual Challenge',
            descriptionMarkdown: 'Complete 21 days of morning rituals to build lasting habits.',
            trackType: 'ritual_series',
            metaJson: JSON.stringify({ frequency: 'daily', requiredCompletions: 21 }),
            orderIndex: 0,
            actions: {
              create: [
                {
                  orderIndex: 1,
                  actionType: 'ritual',
                  externalRefJson: JSON.stringify({
                    ritualId: 'ritual-morning-meditation',
                    ritualKey: 'morning-meditation',
                  }),
                  scheduledAt: new Date('2025-03-01T06:00:00Z'),
                  status: 'scheduled',
                },
                {
                  orderIndex: 2,
                  actionType: 'ritual',
                  externalRefJson: JSON.stringify({
                    ritualId: 'ritual-gratitude-journal',
                    ritualKey: 'gratitude-journal',
                  }),
                  scheduledAt: new Date('2025-03-01T21:00:00Z'),
                  status: 'scheduled',
                },
              ],
            },
          },
          {
            key: 'creative-challenge',
            name: '🎨 Creative Expression Challenge',
            descriptionMarkdown: 'Complete quests to unlock your creative potential.',
            trackType: 'challenge',
            metaJson: JSON.stringify({ points: 1000, difficulty: 'medium' }),
            orderIndex: 1,
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
                  status: 'scheduled',
                },
                {
                  orderIndex: 2,
                  actionType: 'quest',
                  externalRefJson: JSON.stringify({
                    questId: 'quest-photo-story',
                    questKey: 'spring-photo-story',
                  }),
                  scheduledAt: new Date('2025-03-12T00:00:00Z'),
                  status: 'scheduled',
                },
              ],
            },
          },
          {
            key: 'wisdom-series',
            name: '📚 Spring Wisdom Series',
            descriptionMarkdown: 'Curated content to inspire your spring journey.',
            trackType: 'content_series',
            metaJson: JSON.stringify({ category: 'educational' }),
            orderIndex: 2,
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
                  status: 'completed',
                },
                {
                  orderIndex: 2,
                  actionType: 'live_session',
                  externalRefJson: JSON.stringify({
                    sessionId: 'live-spring-celebration',
                    sessionTitle: 'Spring Equinox Celebration',
                    duration: 90,
                  }),
                  scheduledAt: new Date('2025-03-20T18:00:00Z'),
                  status: 'scheduled',
                },
              ],
            },
          },
        ],
      },
    },
  });

  // Link tags to spring campaign
  await Promise.all([
    prisma.campaignTagRelation.create({
      data: {
        campaignId: springCampaign.id,
        tagId: tags.find((t) => t.key === 'mindfulness')!.id,
      },
    }),
    prisma.campaignTagRelation.create({
      data: {
        campaignId: springCampaign.id,
        tagId: tags.find((t) => t.key === 'community')!.id,
      },
    }),
  ]);

  // Upcoming Campaign from template
  const summerCampaign = await prisma.festivalCampaign.create({
    data: {
      communityId: 'community-001',
      key: 'summer-mindfulness-2025',
      name: 'Summer Mindfulness Retreat',
      descriptionMarkdown: mindfulnessTemplate.descriptionMarkdown,
      startAt: new Date('2025-06-01T00:00:00Z'),
      endAt: new Date('2025-06-21T23:59:59Z'),
      themeTagsJson: JSON.stringify(['summer', 'mindfulness', 'retreat']),
      status: 'draft',
      templateId: mindfulnessTemplate.id,
    },
  });

  console.log(`✅ Created 2 campaigns`);

  // Create Participants and Progress
  console.log('\n👥 Creating participants...');

  const participants = [];
  for (let i = 1; i <= 10; i++) {
    const participant = await prisma.participantFestivalState.create({
      data: {
        campaignId: springCampaign.id,
        memberId: `member-${String(i).padStart(3, '0')}`,
        status: i <= 8 ? 'active' : i === 9 ? 'completed' : 'dropped',
        progressJson: JSON.stringify({
          tracks: i <= 8 ? [
            {
              trackId: 'track-1',
              actions: [
                {
                  actionId: 'action-1',
                  completed: true,
                  completedAt: new Date().toISOString(),
                },
              ],
            },
          ] : [],
          totalActionsCompleted: i <= 8 ? Math.floor(Math.random() * 5) + 1 : 0,
          lastActivityAt: new Date().toISOString(),
        }),
      },
    });
    participants.push(participant);
  }

  console.log(`✅ Created ${participants.length} participants`);

  // Create Analytics
  console.log('\n📊 Creating analytics...');
  await prisma.campaignAnalytics.create({
    data: {
      campaignId: springCampaign.id,
      totalParticipants: 10,
      activeParticipants: 8,
      completedParticipants: 1,
      droppedParticipants: 1,
      totalActions: 6,
      completedActions: 15,
      averageCompletion: 0.25,
      engagementScore: 75.5,
      lastCalculatedAt: new Date(),
      metricsJson: JSON.stringify({
        dailyActiveUsers: [5, 6, 7, 8, 8, 7, 8],
        completionTrend: [0.1, 0.15, 0.2, 0.25],
      }),
    },
  });

  // Create Achievements
  console.log('\n🏆 Creating achievements...');
  await Promise.all([
    prisma.memberAchievement.create({
      data: {
        campaignId: springCampaign.id,
        memberId: 'member-001',
        achievementType: 'early_bird',
        achievementKey: 'early_adopter',
        title: '🚀 Early Adopter',
        description: 'Joined within first 24 hours',
        dataJson: JSON.stringify({ joinedHoursAfterStart: 2 }),
      },
    }),
    prisma.memberAchievement.create({
      data: {
        campaignId: springCampaign.id,
        memberId: 'member-001',
        achievementType: 'track_completed',
        achievementKey: 'first_track_completed',
        title: '🎯 First Track Champion',
        description: 'Completed first track',
        dataJson: JSON.stringify({ trackKey: 'morning-rituals' }),
      },
    }),
  ]);

  // Create Notification Logs
  console.log('\n📬 Creating notification logs...');
  await Promise.all([
    prisma.notificationLog.create({
      data: {
        recipientId: 'member-001',
        type: 'campaign_start',
        title: 'Spring Awakening has begun!',
        body: 'Your festival journey starts now',
        status: 'sent',
        sentAt: new Date('2025-03-01T00:00:00Z'),
      },
    }),
    prisma.notificationLog.create({
      data: {
        recipientId: 'member-002',
        type: 'action_available',
        title: 'New quest available',
        body: 'A creative challenge awaits',
        status: 'pending',
      },
    }),
  ]);

  // Create Integration Logs
  console.log('\n🔌 Creating integration logs...');
  await Promise.all([
    prisma.integrationLog.create({
      data: {
        campaignId: springCampaign.id,
        service: 'notification-hub',
        operation: 'send_notification',
        requestJson: JSON.stringify({ recipientId: 'member-001', type: 'campaign_start' }),
        responseJson: JSON.stringify({ success: true, notificationId: 'notif-123' }),
        status: 'success',
        durationMs: 45,
      },
    }),
    prisma.integrationLog.create({
      data: {
        campaignId: springCampaign.id,
        service: 'ritual-orchestrator',
        operation: 'activate_ritual',
        requestJson: JSON.stringify({ ritualId: 'ritual-001', memberId: 'member-001' }),
        responseJson: JSON.stringify({ success: true, scheduleId: 'sched-456' }),
        status: 'success',
        durationMs: 120,
      },
    }),
  ]);

  console.log('\n🎉 Enhanced seed completed successfully!');
  console.log('\nSummary:');
  console.log(`- ${tags.length} tags`);
  console.log(`- 2 campaign templates`);
  console.log(`- 2 campaigns (1 active, 1 upcoming)`);
  console.log(`- ${participants.length} participants`);
  console.log('- 2 achievements');
  console.log('- 2 notification logs');
  console.log('- 2 integration logs');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
