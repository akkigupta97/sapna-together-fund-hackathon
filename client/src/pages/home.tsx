import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import AppLayout from "@/components/layout/app-layout";
import { Moon, Settings, Sparkles, Bed, Leaf, Droplets, Headphones, Music, Play } from "lucide-react";
import { useAudio } from "@/lib/audio-context";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import type { User, SleepProfile, GeneratedAudio, SleepSession } from "@shared/schema";

export default function Home() {
  const { toast } = useToast();
  const { playAudio } = useAudio();
  const [isGenerating, setIsGenerating] = useState(false);
  const userId = localStorage.getItem("currentUserId") || "demo-user-123";

  const { data: user } = useQuery<User>({
    queryKey: ["/api/users", userId],
  });

  const { data: sleepProfile } = useQuery<SleepProfile>({
    queryKey: ["/api/sleep-profile", userId],
  });

  const { data: audios = [] } = useQuery<GeneratedAudio[]>({
    queryKey: ["/api/audios", userId],
  });

  const { data: latestSession } = useQuery<SleepSession>({
    queryKey: ["/api/sleep-sessions", userId, "latest"],
  });

  // Create demo user if doesn't exist
  useEffect(() => {
    if (!user) {
      apiRequest("POST", "/api/users", {
        username: "demo-user",
        email: "demo@example.com", 
        name: "Demo User"
      }).catch(() => {
        // User might already exist, ignore error
      });
    }
  }, [user]);

  const handleGenerateAudio = async () => {
    if (!sleepProfile) {
      toast({
        title: "Complete your sleep profile first",
        description: "Set up your sleep preferences to generate personalized audio.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    try {
      await apiRequest("POST", "/api/audios/generate", {
        userId,
        category: sleepProfile.soundPreferences?.[0] || "nature",
        preferences: sleepProfile.soundPreferences || ["nature"],
        duration: Math.floor((sleepProfile.preferredDuration || 480) / 60), // Convert to hours
        environment: sleepProfile.sleepEnvironment || "quiet",
      });

      toast({
        title: "Audio generated successfully!",
        description: "Your personalized sleep audio is ready to play.",
      });
    } catch (error) {
      toast({
        title: "Generation failed",
        description: "Please try again in a moment.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleStartSleep = async () => {
    try {
      await apiRequest("POST", "/api/sleep-sessions", {
        userId,
        startTime: new Date().toISOString(),
      });

      toast({
        title: "Sleep tracking started",
        description: "Sweet dreams! We'll track your sleep session.",
      });
    } catch (error) {
      toast({
        title: "Failed to start tracking",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const categories = [
    { name: "Nature", icon: Leaf, color: "text-mint-green" },
    { name: "White Noise", icon: Droplets, color: "text-blue-400" },
    { name: "ASMR", icon: Headphones, color: "text-soft-purple" },
    { name: "Ambient", icon: Music, color: "text-warm-amber" },
  ];

  return (
    <AppLayout>
      {/* Mobile Header - only show on mobile */}
      <div className="md:hidden flex items-center justify-between p-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 gradient-purple rounded-full flex items-center justify-center">
            <Moon className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-white">DreamSound</h1>
            <p className="text-sm text-gray-300">
              {greeting()}, {user?.name || "there"}
            </p>
          </div>
        </div>
        <Button variant="ghost" size="icon" className="glass-button rounded-full">
          <Settings className="text-white" />
        </Button>
      </div>

      {/* Main Content */}
      <div className="px-4 md:px-6 space-y-6">
        {/* Sleep Profile Card */}
        <Card className="glass-card p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Your Sleep Profile</h2>
            <Badge variant="secondary" className="bg-mint-green/20 text-mint-green border-0">
              {sleepProfile ? "Active" : "Setup Needed"}
            </Badge>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-soft-indigo">
                {sleepProfile?.bedtime || "--:--"}
              </div>
              <div className="text-xs text-gray-300">Bedtime</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-soft-purple">
                {sleepProfile ? formatDuration(sleepProfile.preferredDuration) : "--"}
              </div>
              <div className="text-xs text-gray-300">Duration</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-warm-amber">
                {sleepProfile?.soundPreferences?.[0] || "Not Set"}
              </div>
              <div className="text-xs text-gray-300">Preference</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-mint-green">
                {latestSession?.quality ? `${latestSession.quality}%` : "--"}
              </div>
              <div className="text-xs text-gray-300">Quality</div>
            </div>
          </div>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <Button
            onClick={handleGenerateAudio}
            disabled={isGenerating}
            className="gradient-purple p-4 h-auto text-left hover:scale-105 transition-transform duration-300 flex flex-col items-center space-y-2"
          >
            <Sparkles className="text-2xl" />
            <div className="font-medium">
              {isGenerating ? "Generating..." : "Generate Audio"}
            </div>
            <div className="text-xs text-gray-200">AI-powered sounds</div>
          </Button>
          <Button
            onClick={handleStartSleep}
            className="gradient-amber p-4 h-auto text-left hover:scale-105 transition-transform duration-300 flex flex-col items-center space-y-2"
          >
            <Bed className="text-2xl" />
            <div className="font-medium">Start Sleep</div>
            <div className="text-xs text-gray-200">Begin tracking</div>
          </Button>
        </div>

        {/* Featured Sounds */}
        {audios.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-4">Personalized for You</h3>
            <div className="space-y-3">
              {audios.slice(0, 3).map((audio) => (
                <Card key={audio.id} className="glass-card p-4 hover:bg-white/15 transition-all duration-300">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-soft-indigo to-soft-purple rounded-lg flex items-center justify-center">
                      <Music className="text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">{audio.title}</div>
                      <div className="text-sm text-gray-300">{audio.description}</div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => playAudio(audio)}
                      className="w-10 h-10 bg-soft-indigo/20 rounded-full hover:bg-soft-indigo/30"
                    >
                      <Play className="text-soft-indigo" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Categories */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Browse Categories</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {categories.map((category) => (
              <Card
                key={category.name}
                className="glass-card p-4 text-center hover:bg-white/15 transition-all duration-300 cursor-pointer"
              >
                <category.icon className={`${category.color} text-2xl mb-2 mx-auto`} />
                <div className="text-sm font-medium">{category.name}</div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
