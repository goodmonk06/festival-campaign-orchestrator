import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { format } from 'date-fns';

export default async function HomePage() {
  const campaigns = await prisma.festivalCampaign.findMany({
    include: {
      _count: {
        select: {
          tracks: true,
          participants: true,
        },
      },
    },
    orderBy: {
      startAt: 'desc',
    },
    take: 10,
  });

  const now = new Date();

  const activeCampaigns = campaigns.filter((c) => c.startAt <= now && c.endAt >= now);
  const upcomingCampaigns = campaigns.filter((c) => c.startAt > now);
  const pastCampaigns = campaigns.filter((c) => c.endAt < now);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Festival Campaigns</h1>
        <p className="text-gray-600">
          Orchestrate festival-style campaigns with tracks, actions, and participant management.
        </p>
      </div>

      {activeCampaigns.length > 0 && (
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">🔥 Active Campaigns</h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {activeCampaigns.map((campaign) => (
              <CampaignCard key={campaign.id} campaign={campaign} status="active" />
            ))}
          </div>
        </section>
      )}

      {upcomingCampaigns.length > 0 && (
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">📅 Upcoming Campaigns</h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {upcomingCampaigns.map((campaign) => (
              <CampaignCard key={campaign.id} campaign={campaign} status="upcoming" />
            ))}
          </div>
        </section>
      )}

      {pastCampaigns.length > 0 && (
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">✅ Past Campaigns</h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {pastCampaigns.map((campaign) => (
              <CampaignCard key={campaign.id} campaign={campaign} status="past" />
            ))}
          </div>
        </section>
      )}

      {campaigns.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <p className="text-gray-500 text-lg mb-4">No campaigns found</p>
          <p className="text-gray-400">Run the seed script to create a demo campaign:</p>
          <code className="bg-gray-100 text-gray-800 px-4 py-2 rounded mt-2 inline-block">
            npm run db:seed
          </code>
        </div>
      )}
    </div>
  );
}

function CampaignCard({
  campaign,
  status,
}: {
  campaign: any;
  status: 'active' | 'upcoming' | 'past';
}) {
  const statusColors = {
    active: 'bg-green-100 text-green-800 border-green-200',
    upcoming: 'bg-blue-100 text-blue-800 border-blue-200',
    past: 'bg-gray-100 text-gray-800 border-gray-200',
  };

  const statusLabels = {
    active: '🔥 Active',
    upcoming: '📅 Upcoming',
    past: '✅ Completed',
  };

  return (
    <Link href={`/campaigns/${campaign.id}`}>
      <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow cursor-pointer">
        <div className="flex items-start justify-between mb-3">
          <h3 className="text-xl font-semibold text-gray-900">{campaign.name}</h3>
          <span
            className={`px-2 py-1 text-xs font-medium rounded border ${statusColors[status]}`}
          >
            {statusLabels[status]}
          </span>
        </div>

        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
          {campaign.descriptionMarkdown.split('\n')[0].replace(/^#+ /, '')}
        </p>

        <div className="space-y-2 text-sm text-gray-500">
          <div className="flex items-center">
            <span className="font-medium mr-2">📅 Duration:</span>
            {format(new Date(campaign.startAt), 'MMM d')} -{' '}
            {format(new Date(campaign.endAt), 'MMM d, yyyy')}
          </div>
          <div className="flex items-center">
            <span className="font-medium mr-2">🎯 Tracks:</span>
            {campaign._count.tracks}
          </div>
          <div className="flex items-center">
            <span className="font-medium mr-2">👥 Participants:</span>
            {campaign._count.participants}
          </div>
        </div>

        {JSON.parse(campaign.themeTagsJson).length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {JSON.parse(campaign.themeTagsJson)
              .slice(0, 3)
              .map((tag: string) => (
                <span
                  key={tag}
                  className="px-2 py-1 bg-purple-50 text-purple-700 text-xs rounded"
                >
                  {tag}
                </span>
              ))}
          </div>
        )}
      </div>
    </Link>
  );
}
