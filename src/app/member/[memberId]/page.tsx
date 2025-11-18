import { prisma } from '@/lib/prisma';
import { format } from 'date-fns';
import Link from 'next/link';
import type { ParticipantProgress } from '@/types/festival';

export default async function MemberProgressPage({
  params,
}: {
  params: { memberId: string };
}) {
  const participations = await prisma.participantFestivalState.findMany({
    where: {
      memberId: params.memberId,
    },
    include: {
      campaign: {
        include: {
          tracks: {
            include: {
              actions: {
                orderBy: { orderIndex: 'asc' },
              },
            },
          },
        },
      },
    },
    orderBy: {
      joinedAt: 'desc',
    },
  });

  if (participations.length === 0) {
    return (
      <div className="text-center py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Member Progress</h1>
        <p className="text-gray-600 mb-8">No participations found for member: {params.memberId}</p>
        <Link href="/" className="text-blue-600 hover:text-blue-800">
          ← Back to campaigns
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <Link href="/" className="text-blue-600 hover:text-blue-800 flex items-center gap-2 mb-4">
          ← Back to campaigns
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Member Progress</h1>
        <p className="text-gray-600">Member ID: {params.memberId}</p>
      </div>

      <div className="grid gap-6">
        {participations.map((participation) => {
          const progress: ParticipantProgress = JSON.parse(participation.progressJson);
          const totalActions = participation.campaign.tracks.reduce(
            (sum, track) => sum + track.actions.length,
            0
          );

          return (
            <div key={participation.id} className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <Link
                    href={`/campaigns/${participation.campaign.id}`}
                    className="text-2xl font-bold text-gray-900 hover:text-blue-600"
                  >
                    {participation.campaign.name}
                  </Link>
                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                    <span>
                      Joined: {format(new Date(participation.joinedAt), 'MMM d, yyyy')}
                    </span>
                    <span>
                      Last active:{' '}
                      {progress.lastActivityAt
                        ? format(new Date(progress.lastActivityAt), 'MMM d, yyyy h:mm a')
                        : 'Never'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Progress summary */}
              <div className="mb-6 p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-lg font-semibold text-gray-900">Overall Progress</span>
                  <span className="text-2xl font-bold text-purple-700">
                    {progress.totalActionsCompleted || 0} / {totalActions}
                  </span>
                </div>
                <div className="w-full bg-white rounded-full h-3 overflow-hidden border border-purple-200">
                  <div
                    className="bg-gradient-to-r from-purple-500 to-blue-500 h-full transition-all duration-500"
                    style={{
                      width: `${totalActions > 0 ? ((progress.totalActionsCompleted || 0) / totalActions) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>

              {/* Track progress */}
              <div className="space-y-4">
                {participation.campaign.tracks.map((track) => {
                  const trackProgress = progress.tracks.find((t) => t.trackId === track.id);
                  const completedActions =
                    trackProgress?.actions.filter((a) => a.completed).length || 0;

                  return (
                    <div key={track.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-semibold text-gray-900">{track.name}</h3>
                          <p className="text-sm text-gray-600">{track.descriptionMarkdown}</p>
                        </div>
                        <span className="text-sm font-medium text-gray-700">
                          {completedActions} / {track.actions.length}
                        </span>
                      </div>

                      <div className="space-y-2">
                        {track.actions.map((action) => {
                          const actionProgress = trackProgress?.actions.find(
                            (a) => a.actionId === action.id
                          );
                          const isCompleted = actionProgress?.completed || false;
                          const externalRef = JSON.parse(action.externalRefJson);

                          return (
                            <div
                              key={action.id}
                              className={`flex items-center gap-3 p-3 rounded ${
                                isCompleted
                                  ? 'bg-green-50 border border-green-200'
                                  : 'bg-gray-50 border border-gray-200'
                              }`}
                            >
                              <div className="flex-shrink-0">
                                {isCompleted ? (
                                  <span className="text-2xl">✅</span>
                                ) : (
                                  <span className="text-2xl opacity-30">⭕</span>
                                )}
                              </div>
                              <div className="flex-grow">
                                <div className="font-medium text-gray-900">
                                  {externalRef.sessionTitle ||
                                    externalRef.topic ||
                                    externalRef.questKey ||
                                    externalRef.ritualKey ||
                                    'Action'}
                                </div>
                                <div className="text-xs text-gray-500">
                                  Type: {action.actionType}
                                  {action.scheduledAt &&
                                    ` • Scheduled: ${format(new Date(action.scheduledAt), 'MMM d, h:mm a')}`}
                                </div>
                                {actionProgress?.completedAt && (
                                  <div className="text-xs text-green-700 mt-1">
                                    Completed: {format(new Date(actionProgress.completedAt), 'MMM d, h:mm a')}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
