import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import AppLayout from "@/components/layout/app-layout";
import { useLocation } from "wouter";
import { 
  User, 
  Settings, 
  Bell, 
  Download, 
  Shield, 
  HelpCircle, 
  ChevronRight,
  Trophy,
  Target,
  Calendar,
  TrendingUp
} from "lucide-react";
import { format } from "date-fns";
import type { User as UserType, SleepSession, GeneratedAudio } from "@shared/schema";

export default function Profile() {
  const [, setLocation] = useLocation();
  const userId = localStorage.getItem("currentUserId") || "demo-user-123";

  const { data: user } = useQuery<UserType>({
    queryKey: ["/api/users", userId],
  });

  const { data: sessions = [] } = useQuery<SleepSession[]>({
    queryKey: ["/api/sleep-sessions", userId],
  });

  const { data: audios = [] } = useQuery<GeneratedAudio[]>({
    queryKey: ["/api/audios", userId],
  });

  const formatDuration = (minutes: number) => {
    if (!minutes) return "0h 0m";
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const avgDuration = sessions.length > 0
    ? Math.round(sessions.reduce((sum, s) => sum + (s.duration || 0), 0) / sessions.length)
    : 0;

  const avgQuality = sessions.length > 0
    ? Math.round(sessions.reduce((sum, s) => sum + (s.quality || 0), 0) / sessions.length)
    : 0;

  const streak = sessions.length; // Simplified streak calculation

  const settingsItems = [
    { icon: Settings, label: "Sleep Profile", href: "/onboarding" },
    // { icon: Bell, label: "Notifications", href: "#" },
    // { icon: Download, label: "Audio Downloads", href: "#" },
    { icon: Shield, label: "Privacy & Security", href: "/privacy" },
    { icon: HelpCircle, label: "Help & Support", href: "/help" },
  ];

  return (
    <AppLayout>
      {/* Header - Mobile optimized */}
      <div className="p-3 sm:p-4 md:p-6">
        <h1 className="text-xl sm:text-2xl font-bold text-white">Profile</h1>
        <p className="text-sm sm:text-base text-gray-300">Manage your account and preferences</p>
      </div>

      {/* Main Content - Better mobile spacing */}
      <div className="px-3 sm:px-4 md:px-6 space-y-4 sm:space-y-6 pb-20 sm:pb-6">
        {/* Profile Header - Mobile responsive */}
        <Card className="glass-card p-4 sm:p-6 text-center">
          <div className="w-16 sm:w-20 h-16 sm:h-20 gradient-amber rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
            <User className="text-white text-xl sm:text-2xl" />
          </div>
          <h2 className="text-lg sm:text-xl font-semibold mb-1">
            {user?.name || "Sleep Enthusiast"}
          </h2>
          <p className="text-sm sm:text-base text-gray-300">
            Member since {user?.createdAt ? format(new Date(user.createdAt), "MMMM yyyy") : "recently"}
          </p>
          <div className="mt-3 sm:mt-4">
            <Badge variant="secondary" className="bg-mint-green/20 text-mint-green border-0 text-xs sm:text-sm">
              {sessions.length > 0 ? "Active Sleeper" : "Getting Started"}
            </Badge>
          </div>
        </Card>

        {/* Sleep Journey Stats - Mobile responsive grid */}
        <Card className="glass-card p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Your Sleep Journey</h3>
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <div className="text-center p-2 sm:p-0">
              <div className="flex flex-col sm:flex-row items-center justify-center mb-2">
                <Calendar className="text-mint-green mb-1 sm:mb-0 sm:mr-2 w-4 h-4 sm:w-5 sm:h-5" />
                <div className="text-lg sm:text-2xl font-bold text-mint-green">{sessions.length}</div>
              </div>
              <div className="text-xs sm:text-sm text-gray-300">Sleep Sessions</div>
            </div>
            <div className="text-center p-2 sm:p-0">
              <div className="flex flex-col sm:flex-row items-center justify-center mb-2">
                <TrendingUp className="text-soft-indigo mb-1 sm:mb-0 sm:mr-2 w-4 h-4 sm:w-5 sm:h-5" />
                <div className="text-lg sm:text-2xl font-bold text-soft-indigo">
                  {formatDuration(avgDuration)}
                </div>
              </div>
              <div className="text-xs sm:text-sm text-gray-300">Avg Duration</div>
            </div>
            <div className="text-center p-2 sm:p-0">
              <div className="flex flex-col sm:flex-row items-center justify-center mb-2">
                <Target className="text-soft-purple mb-1 sm:mb-0 sm:mr-2 w-4 h-4 sm:w-5 sm:h-5" />
                <div className="text-lg sm:text-2xl font-bold text-soft-purple">{avgQuality}%</div>
              </div>
              <div className="text-xs sm:text-sm text-gray-300">Avg Quality</div>
            </div>
            <div className="text-center p-2 sm:p-0">
              <div className="flex flex-col sm:flex-row items-center justify-center mb-2">
                <Trophy className="text-warm-amber mb-1 sm:mb-0 sm:mr-2 w-4 h-4 sm:w-5 sm:h-5" />
                <div className="text-lg sm:text-2xl font-bold text-warm-amber">{streak}</div>
              </div>
              <div className="text-xs sm:text-sm text-gray-300">Day Streak</div>
            </div>
          </div>
        </Card>

        {/* Audio Library Stats - Mobile optimized */}
        <Card className="glass-card p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Audio Library</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-center">
            <div className="p-3 sm:p-0">
              <div className="text-xl sm:text-2xl font-bold text-soft-indigo mb-1">{audios.length}</div>
              <div className="text-xs sm:text-sm text-gray-300">Generated Sounds</div>
            </div>
            <div className="p-3 sm:p-0">
              <div className="text-xl sm:text-2xl font-bold text-mint-green mb-1">
                {audios.filter(a => a.isFavorite).length}
              </div>
              <div className="text-xs sm:text-sm text-gray-300">Favorites</div>
            </div>
          </div>
        </Card>

        {/* Settings Menu - Mobile optimized */}
        <div className="space-y-2 sm:space-y-3">
          <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Settings</h3>
          
          {settingsItems.map((item, index) => (
            <Card
              key={index}
              className="glass-card hover:bg-white/15 transition-colors duration-300 cursor-pointer active:scale-95 sm:active:scale-100"
              onClick={() => {
                setLocation(item.href);
              }}
            >
              <div className="p-3 sm:p-4 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <item.icon className={`w-4 h-4 sm:w-5 sm:h-5 ${
                    index === 0 ? "text-soft-indigo" :
                    index === 1 ? "text-warm-amber" :
                    index === 2 ? "text-mint-green" :
                    index === 3 ? "text-soft-purple" :
                    "text-blue-400"
                  }`} />
                  <span className="text-sm sm:text-base">{item.label}</span>
                </div>
                <ChevronRight className="text-gray-400 w-3 h-3 sm:w-4 sm:h-4" />
              </div>
            </Card>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
