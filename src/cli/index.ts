#!/usr/bin/env node

/**
 * Festival Campaign Orchestrator CLI
 *
 * Command-line tool for managing campaigns, templates, and analytics.
 */

import { prisma } from '../lib/prisma';
import { achievementService } from '../lib/services/achievement-service';

const args = process.argv.slice(2);
const command = args[0];

async function main() {
  switch (command) {
    case 'campaigns:list':
      await listCampaigns();
      break;
    case 'campaigns:activate':
      await activateCampaign(args[1]);
      break;
    case 'analytics:recalculate':
      await recalculateAnalytics(args[1]);
      break;
    case 'achievements:check':
      await checkAchievements(args[1], args[2]);
      break;
    case 'templates:list':
      await listTemplates();
      break;
    case 'help':
    default:
      printHelp();
      break;
  }
}

function printHelp() {
  console.log(`
🎉 Festival Campaign Orchestrator CLI

Usage: npm run cli <command> [options]

Commands:
  campaigns:list                List all campaigns
  campaigns:activate <id>       Activate a campaign by ID
  analytics:recalculate <id>    Recalculate analytics for a campaign
  achievements:check <campaignId> <memberId>  Check achievements for a participant
  templates:list                List all templates
  help                          Show this help message

Examples:
  npm run cli campaigns:list
  npm run cli campaigns:activate clrx123abc
  npm run cli analytics:recalculate clrx123abc
  npm run cli achievements:check clrx123abc member-001
`);
}

async function listCampaigns() {
  console.log('\n📋 Campaigns:\n');

  const campaigns = await prisma.festivalCampaign.findMany({
    include: {
      _count: {
        select: {
          tracks: true,
          participants: true,
        },
      },
    },
    orderBy: { startAt: 'desc' },
  });

  if (campaigns.length === 0) {
    console.log('No campaigns found. Run: npm run db:seed:enhanced\n');
    return;
  }

  campaigns.forEach((campaign) => {
    const statusEmoji = {
      draft: '📝',
      active: '🔥',
      completed: '✅',
      archived: '📦',
    }[campaign.status] || '❓';

    console.log(`${statusEmoji} ${campaign.name}`);
    console.log(`   ID: ${campaign.id}`);
    console.log(`   Status: ${campaign.status}`);
    console.log(`   Tracks: ${campaign._count.tracks}`);
    console.log(`   Participants: ${campaign._count.participants}`);
    console.log(`   Period: ${campaign.startAt.toISOString().split('T')[0]} to ${campaign.endAt.toISOString().split('T')[0]}`);
    console.log('');
  });
}

async function activateCampaign(id: string) {
  if (!id) {
    console.error('❌ Error: Campaign ID required');
    console.log('Usage: npm run cli campaigns:activate <id>');
    return;
  }

  console.log(`\n🚀 Activating campaign: ${id}\n`);

  try {
    const campaign = await prisma.festivalCampaign.update({
      where: { id },
      data: { status: 'active' },
    });

    console.log(`✅ Campaign activated: ${campaign.name}`);
    console.log(`   Status: ${campaign.status}\n`);
  } catch (error) {
    console.error('❌ Error:', error instanceof Error ? error.message : 'Unknown error');
  }
}

async function recalculateAnalytics(campaignId: string) {
  if (!campaignId) {
    console.error('❌ Error: Campaign ID required');
    console.log('Usage: npm run cli analytics:recalculate <campaignId>');
    return;
  }

  console.log(`\n📊 Recalculating analytics for campaign: ${campaignId}\n`);

  try {
    const campaign = await prisma.festivalCampaign.findUnique({
      where: { id: campaignId },
      include: {
        participants: true,
        tracks: {
          include: {
            actions: true,
          },
        },
      },
    });

    if (!campaign) {
      console.error('❌ Campaign not found');
      return;
    }

    const totalParticipants = campaign.participants.length;
    const activeParticipants = campaign.participants.filter((p) => p.status === 'active').length;
    const completedParticipants = campaign.participants.filter((p) => p.status === 'completed').length;
    const totalActions = campaign.tracks.reduce((sum, track) => sum + track.actions.length, 0);

    let completedActionsCount = 0;
    for (const participant of campaign.participants) {
      const progress = JSON.parse(participant.progressJson);
      completedActionsCount += progress.totalActionsCompleted || 0;
    }

    const averageCompletion = totalParticipants > 0 && totalActions > 0
      ? completedActionsCount / (totalParticipants * totalActions)
      : 0;

    const participationRate = totalParticipants > 0 ? activeParticipants / totalParticipants : 0;
    const engagementScore = (participationRate * 0.4 + averageCompletion * 0.6) * 100;

    await prisma.campaignAnalytics.upsert({
      where: { campaignId },
      update: {
        totalParticipants,
        activeParticipants,
        completedParticipants,
        totalActions,
        completedActions: completedActionsCount,
        averageCompletion,
        engagementScore,
        lastCalculatedAt: new Date(),
      },
      create: {
        campaignId,
        totalParticipants,
        activeParticipants,
        completedParticipants,
        totalActions,
        completedActions: completedActionsCount,
        averageCompletion,
        engagementScore,
      },
    });

    console.log('✅ Analytics recalculated:');
    console.log(`   Total Participants: ${totalParticipants}`);
    console.log(`   Active: ${activeParticipants}`);
    console.log(`   Completed: ${completedParticipants}`);
    console.log(`   Engagement Score: ${engagementScore.toFixed(2)}%\n`);
  } catch (error) {
    console.error('❌ Error:', error instanceof Error ? error.message : 'Unknown error');
  }
}

async function checkAchievements(campaignId: string, memberId: string) {
  if (!campaignId || !memberId) {
    console.error('❌ Error: Campaign ID and Member ID required');
    console.log('Usage: npm run cli achievements:check <campaignId> <memberId>');
    return;
  }

  console.log(`\n🏆 Checking achievements for member: ${memberId}\n`);

  try {
    await achievementService.checkAndAwardAchievements(campaignId, memberId);

    const achievements = await prisma.memberAchievement.findMany({
      where: {
        campaignId,
        memberId,
      },
      orderBy: { earnedAt: 'desc' },
    });

    if (achievements.length === 0) {
      console.log('No achievements earned yet. Keep participating!\n');
      return;
    }

    console.log(`✅ ${achievements.length} achievements earned:\n`);
    achievements.forEach((achievement) => {
      console.log(`   ${achievement.title}`);
      console.log(`   ${achievement.description}`);
      console.log(`   Earned: ${achievement.earnedAt.toISOString().split('T')[0]}\n`);
    });
  } catch (error) {
    console.error('❌ Error:', error instanceof Error ? error.message : 'Unknown error');
  }
}

async function listTemplates() {
  console.log('\n📝 Campaign Templates:\n');

  const templates = await prisma.campaignTemplate.findMany({
    include: {
      _count: {
        select: {
          trackTemplates: true,
          campaigns: true,
        },
      },
    },
    orderBy: { usageCount: 'desc' },
  });

  if (templates.length === 0) {
    console.log('No templates found. Run: npm run db:seed:enhanced\n');
    return;
  }

  templates.forEach((template) => {
    const publicIcon = template.isPublic ? '🌐' : '🔒';
    console.log(`${publicIcon} ${template.name}`);
    console.log(`   ID: ${template.id}`);
    console.log(`   Category: ${template.category}`);
    console.log(`   Tracks: ${template._count.trackTemplates}`);
    console.log(`   Used: ${template.usageCount} times\n`);
  });
}

main()
  .catch((e) => {
    console.error('❌ CLI Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
