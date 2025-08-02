import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import AppLayout from "@/components/layout/app-layout";
import SleepChart from "@/components/sleep/sleep-chart";
import { format } from "date-fns";
import type { SleepSession } from "@shared/schema";

export default function SleepTrack() {
  const userId = localStorage.getItem("currentUserId") || "demo-user-123";

  const { data: sessions = [] } = useQuery<SleepSession[]>({
    queryKey: ["/api/sleep-sessions", userId],
  });

  const { data: latestSession } = useQuery<SleepSession>({
    queryKey: ["/api/sleep-sessions", userId, "latest"],
  });

  const formatDuration = (minutes: number) => {
    if (!minutes) return "0h 0m";
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const formatTime = (dateString: string) => {
    return format(new Date(dateString), "h:mm a");
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "MMMM d, yyyy");
  };

  const avgDuration = sessions.length > 0
    ? Math.round(sessions.reduce((sum, s) => sum + (s.duration || 0), 0) / sessions.length)
    : 0;

  const avgQuality = sessions.length > 0
    ? Math.round(sessions.reduce((sum, s) => sum + (s.quality || 0), 0) / sessions.length)
    : 0;

  return (
    <AppLayout>
      {/* Header */}
      <div className="p-4 md:p-6">
        <h1 className="text-2xl font-bold text-white">Sleep Tracking</h1>
        <p className="text-gray-300">Monitor your sleep patterns and quality</p>
      </div>

      {/* Main Content */}
      <div className="px-4 md:px-6 space-y-6">
        {/* Sleep Overview */}
        <Card className="glass-card p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Sleep Overview</h2>
          <div className="text-center mb-6">
            <div className="text-4xl font-bold text-mint-green mb-2">
              {latestSession?.duration ? formatDuration(latestSession.duration) : "No data"}
            </div>
            <div className="text-gray-300">Last night's sleep</div>
          </div>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-xl font-semibold text-soft-indigo">
                {latestSession?.deepSleep ? formatDuration(latestSession.deepSleep) : "--"}
              </div>
              <div className="text-xs text-gray-300">Deep Sleep</div>
            </div>
            <div>
              <div className="text-xl font-semibold text-soft-purple">
                {latestSession?.lightSleep ? formatDuration(latestSession.lightSleep) : "--"}
              </div>
              <div className="text-xs text-gray-300">Light Sleep</div>
            </div>
            <div>
              <div className="text-xl font-semibold text-warm-amber">
                {latestSession?.remSleep ? formatDuration(latestSession.remSleep) : "--"}
              </div>
              <div className="text-xs text-gray-300">REM Sleep</div>
            </div>
          </div>
        </Card>

        {/* Weekly Stats */}
        <Card className="glass-card p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4">Weekly Stats</h3>
          <div className="grid grid-cols-2 gap-6 text-center">
            <div>
              <div className="text-2xl font-bold text-soft-indigo mb-1">
                {formatDuration(avgDuration)}
              </div>
              <div className="text-sm text-gray-300">Average Duration</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-mint-green mb-1">
                {avgQuality}%
              </div>
              <div className="text-sm text-gray-300">Average Quality</div>
            </div>
          </div>
        </Card>

        {/* Sleep Chart */}
        <Card className="glass-card p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4">Weekly Trends</h3>
          <SleepChart sessions={sessions.slice(0, 7)} />
        </Card>

        {/* Sleep History */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Recent Sessions</h3>
          {sessions.length === 0 ? (
            <Card className="glass-card p-6 text-center">
              <div className="text-gray-400">
                <div className="text-3xl mb-2">😴</div>
                <div>No sleep sessions yet</div>
                <div className="text-sm mt-1">Start tracking your sleep to see insights here</div>
              </div>
            </Card>
          ) : (
            <div className="space-y-3">
              {sessions.slice(0, 10).map((session) => (
                <Card key={session.id} className="glass-card p-4">
                  <div className="flex justify-between items-center mb-2">
                    <div className="font-medium">
                      {session.startTime ? formatDate(session.startTime) : "Unknown date"}
                    </div>
                    <div className="text-mint-green font-semibold">
                      {session.duration ? formatDuration(session.duration) : "--"}
                    </div>
                  </div>
                  <div className="flex justify-between text-sm text-gray-300">
                    <span>
                      {session.startTime && session.endTime
                        ? `${formatTime(session.startTime)} - ${formatTime(session.endTime)}`
                        : "Time not recorded"}
                    </span>
                    <span>Quality: {session.quality || 0}%</span>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
