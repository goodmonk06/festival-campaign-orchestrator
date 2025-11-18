import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { format } from 'date-fns';
import Link from 'next/link';

export default async function CampaignDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const campaign = await prisma.festivalCampaign.findUnique({
    where: { id: params.id },
    include: {
      tracks: {
        include: {
          actions: {
            orderBy: { orderIndex: 'asc' },
          },
        },
        orderBy: { createdAt: 'asc' },
      },
      _count: {
        select: { participants: true },
      },
    },
  });

  if (!campaign) {
    notFound();
  }

  const now = new Date();
  const isActive = campaign.startAt <= now && campaign.endAt >= now;
  const isUpcoming = campaign.startAt > now;
  const isPast = campaign.endAt < now;

  return (
    <div className="space-y-8">
      {/* Back button */}
      <Link href="/" className="text-blue-600 hover:text-blue-800 flex items-center gap-2">
        ← Back to campaigns
      </Link>

      {/* Header */}
      <div className="bg-white border border-gray-200 rounded-lg p-8">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">{campaign.name}</h1>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span>
                📅 {format(new Date(campaign.startAt), 'MMM d, yyyy')} -{' '}
                {format(new Date(campaign.endAt), 'MMM d, yyyy')}
              </span>
              <span>👥 {campaign._count.participants} participants</span>
            </div>
          </div>
          <div>
            {isActive && (
              <span className="px-4 py-2 bg-green-100 text-green-800 border border-green-200 rounded-lg font-medium">
                🔥 Active
              </span>
            )}
            {isUpcoming && (
              <span className="px-4 py-2 bg-blue-100 text-blue-800 border border-blue-200 rounded-lg font-medium">
                📅 Upcoming
              </span>
            )}
            {isPast && (
              <span className="px-4 py-2 bg-gray-100 text-gray-800 border border-gray-200 rounded-lg font-medium">
                ✅ Completed
              </span>
            )}
          </div>
        </div>

        {JSON.parse(campaign.themeTagsJson).length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {JSON.parse(campaign.themeTagsJson).map((tag: string) => (
              <span key={tag} className="px-3 py-1 bg-purple-50 text-purple-700 text-sm rounded-full">
                {tag}
              </span>
            ))}
          </div>
        )}

        <div className="prose max-w-none markdown-content text-gray-700">
          {campaign.descriptionMarkdown.split('\n').map((line, i) => {
            if (line.startsWith('# ')) {
              return (
                <h1 key={i} className="text-3xl font-bold mb-4">
                  {line.replace('# ', '')}
                </h1>
              );
            }
            if (line.startsWith('## ')) {
              return (
                <h2 key={i} className="text-2xl font-bold mb-3 mt-6">
                  {line.replace('## ', '')}
                </h2>
              );
            }
            if (line.trim().startsWith('- ')) {
              return (
                <li key={i} className="ml-6">
                  {line.replace('- ', '')}
                </li>
              );
            }
            if (line.trim()) {
              return (
                <p key={i} className="mb-4">
                  {line}
                </p>
              );
            }
            return null;
          })}
        </div>
      </div>

      {/* Tracks */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          🎯 Tracks ({campaign.tracks.length})
        </h2>
        <div className="space-y-6">
          {campaign.tracks.map((track) => (
            <div key={track.id} className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{track.name}</h3>
                  <p className="text-gray-600">{track.descriptionMarkdown}</p>
                </div>
                <TrackTypeBadge type={track.trackType} />
              </div>

              {/* Track metadata */}
              <div className="mb-4 p-3 bg-gray-50 rounded text-sm">
                <strong>Metadata:</strong>{' '}
                <code className="text-purple-700">{track.metaJson}</code>
              </div>

              {/* Actions */}
              <div>
                <h4 className="font-semibold text-gray-700 mb-3">
                  Actions ({track.actions.length})
                </h4>
                <div className="space-y-2">
                  {track.actions.map((action) => {
                    const externalRef = JSON.parse(action.externalRefJson);
                    return (
                      <div
                        key={action.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded border border-gray-200"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-gray-500 font-mono text-sm">
                            #{action.orderIndex}
                          </span>
                          <ActionTypeIcon type={action.actionType} />
                          <div>
                            <div className="font-medium text-gray-900">
                              {externalRef.sessionTitle ||
                                externalRef.topic ||
                                externalRef.questKey ||
                                externalRef.ritualKey ||
                                'Action'}
                            </div>
                            {action.scheduledAt && (
                              <div className="text-xs text-gray-500">
                                Scheduled: {format(new Date(action.scheduledAt), 'MMM d, h:mm a')}
                              </div>
                            )}
                          </div>
                        </div>
                        <code className="text-xs text-gray-500 bg-white px-2 py-1 rounded border">
                          {action.actionType}
                        </code>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* API Examples */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">📡 API Examples</h3>
        <div className="space-y-3 text-sm">
          <div>
            <strong className="text-gray-700">Join this campaign:</strong>
            <code className="block mt-1 p-2 bg-white rounded text-xs overflow-x-auto">
              POST /api/participants/join
              <br />
              {'{'} "campaignId": "{campaign.id}", "memberId": "member-123" {'}'}
            </code>
          </div>
          <div>
            <strong className="text-gray-700">View campaign details:</strong>
            <code className="block mt-1 p-2 bg-white rounded text-xs overflow-x-auto">
              GET /api/campaigns/{campaign.id}
            </code>
          </div>
        </div>
      </div>
    </div>
  );
}

function TrackTypeBadge({ type }: { type: string }) {
  const badges = {
    challenge: { label: '🎯 Challenge', color: 'bg-orange-100 text-orange-800 border-orange-200' },
    ritual_series: { label: '🌅 Ritual Series', color: 'bg-purple-100 text-purple-800 border-purple-200' },
    content_series: { label: '📚 Content Series', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  };

  const badge = badges[type as keyof typeof badges] || {
    label: type,
    color: 'bg-gray-100 text-gray-800 border-gray-200',
  };

  return (
    <span className={`px-3 py-1 text-sm font-medium rounded border ${badge.color}`}>
      {badge.label}
    </span>
  );
}

function ActionTypeIcon({ type }: { type: string }) {
  const icons = {
    quest: '🎯',
    ritual: '🌅',
    post: '📝',
    live_session: '🎥',
  };

  return <span className="text-xl">{icons[type as keyof typeof icons] || '📌'}</span>;
}
