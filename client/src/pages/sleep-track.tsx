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
      {/* Header - Optimized padding for mobile */}
      <div className="p-3 sm:p-4 md:p-6">
        <h1 className="text-xl sm:text-2xl font-bold text-white">Sleep Tracking</h1>
        <p className="text-sm sm:text-base text-gray-300">Monitor your sleep patterns and quality</p>
      </div>

      {/* Main Content - Improved mobile spacing */}
      <div className="px-3 sm:px-4 md:px-6 space-y-4 sm:space-y-6 pb-20 sm:pb-6">
        {/* Sleep Overview - Better mobile layout */}
        <Card className="glass-card p-4 sm:p-6">
          <h2 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Sleep Overview</h2>
          <div className="text-center mb-4 sm:mb-6">
            <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-mint-green mb-2">
              {latestSession?.duration ? formatDuration(latestSession.duration) : "No data"}
            </div>
            <div className="text-sm sm:text-base text-gray-300">Last night's sleep</div>
          </div>
          {/* Mobile-first grid - stacks on very small screens, 3 columns on larger */}
          <div className="grid grid-cols-1 xs:grid-cols-3 gap-3 sm:gap-4 text-center">
            <div className="py-2">
              <div className="text-lg sm:text-xl font-semibold text-soft-indigo">
                {latestSession?.deepSleep ? formatDuration(latestSession.deepSleep) : "--"}
              </div>
              <div className="text-xs sm:text-sm text-gray-300">Deep Sleep</div>
            </div>
            <div className="py-2">
              <div className="text-lg sm:text-xl font-semibold text-soft-purple">
                {latestSession?.lightSleep ? formatDuration(latestSession.lightSleep) : "--"}
              </div>
              <div className="text-xs sm:text-sm text-gray-300">Light Sleep</div>
            </div>
            <div className="py-2">
              <div className="text-lg sm:text-xl font-semibold text-warm-amber">
                {latestSession?.remSleep ? formatDuration(latestSession.remSleep) : "--"}
              </div>
              <div className="text-xs sm:text-sm text-gray-300">REM Sleep</div>
            </div>
          </div>
        </Card>

        {/* Weekly Stats - Responsive layout */}
        <Card className="glass-card p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Weekly Stats</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 text-center">
            <div className="p-3 sm:p-0">
              <div className="text-xl sm:text-2xl font-bold text-soft-indigo mb-1">
                {formatDuration(avgDuration)}
              </div>
              <div className="text-xs sm:text-sm text-gray-300">Average Duration</div>
            </div>
            <div className="p-3 sm:p-0">
              <div className="text-xl sm:text-2xl font-bold text-mint-green mb-1">
                {avgQuality}%
              </div>
              <div className="text-xs sm:text-sm text-gray-300">Average Quality</div>
            </div>
          </div>
        </Card>

        {/* Sleep Chart - Responsive container */}
        <Card className="glass-card p-3 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Weekly Trends</h3>
          <div className="overflow-x-auto">
            <SleepChart sessions={sessions.slice(0, 7)} />
          </div>
        </Card>

        {/* Sleep History - Mobile optimized */}
        <div>
          <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Recent Sessions</h3>
          {sessions.length === 0 ? (
            <Card className="glass-card p-4 sm:p-6 text-center">
              <div className="text-gray-400">
                <div className="text-2xl sm:text-3xl mb-2">😴</div>
                <div className="text-sm sm:text-base">No sleep sessions yet</div>
                <div className="text-xs sm:text-sm mt-1">Start tracking your sleep to see insights here</div>
              </div>
            </Card>
          ) : (
            <div className="space-y-2 sm:space-y-3">
              {sessions.slice(0, 10).map((session) => (
                <Card key={session.id} className="glass-card p-3 sm:p-4">
                  {/* Mobile-first responsive layout */}
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-2 space-y-1 sm:space-y-0">
                    <div className="font-medium text-sm sm:text-base">
                      {session.startTime ? formatDate(session.startTime) : "Unknown date"}
                    </div>
                    <div className="text-mint-green font-semibold text-sm sm:text-base">
                      {session.duration ? formatDuration(session.duration) : "--"}
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:justify-between text-xs sm:text-sm text-gray-300 space-y-1 sm:space-y-0">
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
