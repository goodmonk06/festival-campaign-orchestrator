/**
 * Campaign Scheduler Service
 *
 * Coordinates scheduling of actions across external systems.
 * This would typically be called by a cron job or event-driven system.
 */

import { prisma } from '@/lib/prisma';
import {
  scheduleContent,
  sendNotification,
  scheduleNotification,
  activateRitual,
} from '@/lib/integrations';

export async function scheduleCampaignActions(campaignId: string): Promise<void> {
  const campaign = await prisma.festivalCampaign.findUnique({
    where: { id: campaignId },
    include: {
      tracks: {
        include: {
          actions: {
            where: {
              scheduledAt: {
                not: null,
              },
            },
            orderBy: { scheduledAt: 'asc' },
          },
        },
      },
    },
  });

  if (!campaign) {
    throw new Error('Campaign not found');
  }

  console.log(`[Scheduler] Scheduling actions for campaign: ${campaign.name}`);

  for (const track of campaign.tracks) {
    for (const action of track.actions) {
      if (!action.scheduledAt) continue;

      const externalRef = JSON.parse(action.externalRefJson);

      try {
        switch (action.actionType) {
          case 'post':
            await scheduleContent({
              contentId: externalRef.contentId,
              contentType: externalRef.contentType,
              scheduledAt: action.scheduledAt,
              topic: externalRef.topic,
              campaignId: campaign.id,
            });
            console.log(`  ✓ Scheduled content: ${externalRef.topic || externalRef.contentId}`);
            break;

          case 'live_session':
            // Schedule notification reminder for live session
            const reminderTime = new Date(action.scheduledAt);
            reminderTime.setHours(reminderTime.getHours() - 1); // 1 hour before

            await scheduleNotification({
              recipientId: 'broadcast', // Would be filtered by participant list
              type: 'action_available',
              title: 'Live Session Starting Soon',
              body: `${externalRef.sessionTitle} starts in 1 hour!`,
              scheduledAt: reminderTime,
              metadata: {
                campaignId: campaign.id,
                actionId: action.id,
              },
            });
            console.log(`  ✓ Scheduled live session reminder: ${externalRef.sessionTitle}`);
            break;

          case 'ritual':
            // Ritual activation would be triggered when participant joins
            console.log(`  ℹ Ritual scheduled (activated on join): ${externalRef.ritualKey}`);
            break;

          case 'quest':
            // Quest availability notification
            await scheduleNotification({
              recipientId: 'broadcast',
              type: 'action_available',
              title: 'New Quest Available',
              body: `A new quest is now available in ${track.name}!`,
              scheduledAt: action.scheduledAt,
              metadata: {
                campaignId: campaign.id,
                trackId: track.id,
                actionId: action.id,
              },
            });
            console.log(`  ✓ Scheduled quest notification: ${externalRef.questKey}`);
            break;
        }
      } catch (error) {
        console.error(`  ✗ Failed to schedule action ${action.id}:`, error);
      }
    }
  }

  console.log(`[Scheduler] Completed scheduling for campaign: ${campaign.name}`);
}

export async function onParticipantJoin(campaignId: string, memberId: string): Promise<void> {
  const campaign = await prisma.festivalCampaign.findUnique({
    where: { id: campaignId },
    include: {
      tracks: {
        include: {
          actions: true,
        },
      },
    },
  });

  if (!campaign) return;

  // Send welcome notification
  await sendNotification({
    recipientId: memberId,
    type: 'campaign_start',
    title: `Welcome to ${campaign.name}! 🎉`,
    body: campaign.descriptionMarkdown.split('\n')[0],
    metadata: {
      campaignId: campaign.id,
    },
  });

  // Activate any ritual series
  for (const track of campaign.tracks) {
    if (track.trackType === 'ritual_series') {
      for (const action of track.actions) {
        if (action.actionType === 'ritual' && action.scheduledAt) {
          const externalRef = JSON.parse(action.externalRefJson);

          await activateRitual({
            ritualId: externalRef.ritualId,
            ritualKey: externalRef.ritualKey,
            memberId,
            frequency: externalRef.frequency || 'daily',
            startDate: action.scheduledAt,
            endDate: campaign.endAt,
            campaignId: campaign.id,
          });
        }
      }
    }
  }

  console.log(`[Scheduler] Activated participant flows for ${memberId} in campaign ${campaignId}`);
}
