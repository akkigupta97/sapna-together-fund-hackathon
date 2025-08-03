import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import AppLayout from "@/components/layout/app-layout";
import { Moon, Settings, Sparkles, Bed, Headphones, Play, Clock, Heart, Star, Volume2, MoreHorizontal, Plus } from "lucide-react";
import { useAudio } from "@/lib/audio-context";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { User } from "@shared/schema";

// Type definitions
interface GeneratedAudio {
  id: number;
  title: string;
  description: string;
  duration: number;
}

interface SleepProfile {
  name?: string;
  bedtime?: string;
  duration?: string;
  soundPreferences?: string[];
  quality?: number;
}

interface Chronotype {
  type?: string;
}

export default function Home(): JSX.Element {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const { playAudio } = useAudio();
  const [isGenerating, setIsGenerating] = useState(false);
  const userId = localStorage.getItem("currentUserId") || "demo-user-123";
  const [tonightsPersona, setTonightsPersona] = useState<string | null>(null);

  const { data: user } = useQuery<User>({
    queryKey: ["/api/users", userId],
  });

  const { data: sleepProfile } = useQuery<SleepProfile>({
    queryKey: ["/api/sleep-profile", userId],
  });
  
  const chronotype: Chronotype = { type: "Evening" };
  const nightlyPersona = "Relaxed";

  useEffect(() => {
    if (nightlyPersona) {
      setTonightsPersona(nightlyPersona);
    }
  }, [nightlyPersona]);

  const { data: audios = [] } = useQuery<GeneratedAudio[]>({
    queryKey: ["/api/audios", userId],
    queryFn: () => Promise.resolve([
      {
        id: 1,
        title: "Forest Rain",
        description: "Gentle rainfall in a peaceful forest",
        duration: 45
      },
      {
        id: 2,
        title: "Ocean Waves",
        description: "Calming waves on a serene beach",
        duration: 45
      },
      {
        id: 3,
        title: "Mountain Breeze",
        description: "Soft winds through mountain pines",
        duration: 45
      }
    ])
  });

  const handleStartSleep = async (): Promise<void> => {
    if (!sleepProfile || Object.keys(sleepProfile).length === 0) {
      toast({
        title: "Complete your sleep profile",
        description: "Please complete onboarding first",
        variant: "destructive",
      });
      setLocation("/onboarding");
      return;
    }
    
    if (!tonightsPersona) {
      setLocation("/daily-checkin");
      return;
    }
    
    try {
      toast({
        title: "Sleep tracking started",
        description: "Sweet dreams! We'll track your sleep session.",
      });
      setLocation("/audio-experience");
    } catch (error) {
      toast({
        title: "Failed to start tracking",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  };

  const greeting = (): string => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  return (
    <AppLayout>
      {/* Floating Sound Generator Button - positioned above bottom bar */}
      <div className="fixed bottom-20 right-4 md:bottom-24 md:right-6 z-40 group">
        <Button
          onClick={() => setLocation('/sound-generator')}
          className="w-14 h-14 md:w-16 md:h-16 bg-gradient-to-r from-violet-600/90 to-purple-600/90 hover:from-violet-700/90 hover:to-purple-700/90 rounded-full shadow-2xl hover:scale-110 transition-all duration-300 flex items-center justify-center backdrop-blur-sm border border-white/10"
        >
          <Plus className="w-8 h-8 md:w-10 md:h-10 text-white group-hover:scale-110 transition-transform duration-300" />
        </Button>
        <div className="absolute -top-12 right-0 bg-slate-900/95 text-white text-xs md:text-sm px-3 py-1.5 rounded-lg backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap border border-white/10">
          Sound Generator
        </div>
      </div>

      {/* Mobile Header - Improved spacing and typography */}
      <div className="md:hidden flex items-center justify-between p-4 bg-slate-900/50 backdrop-blur-sm border-b border-white/5">
        <div className="flex items-center space-x-3">
          <img src="https://sapna-assets.s3.us-east-1.amazonaws.com/sapna.png" className="text-white h-8 w-8 text-sm rounded-md" />
          <div>
            <h1 className="text-lg font-semibold text-white">Sapna</h1>
            <p className="text-xs text-slate-300">
              {greeting()}, {sleepProfile?.name || "Abinash"}
            </p>
          </div>
        </div>
        <Button variant="ghost" size="icon" className="bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 backdrop-blur-sm">
          <Settings className="text-white w-4 h-4" />
        </Button>
      </div>

      {/* Main Content - Improved spacing and layout */}
      <div className="px-4 md:px-6 lg:px-8 space-y-6 md:space-y-8 pb-28 md:pb-32">
        
        {/* Welcome Section - Desktop only */}
        <div className="hidden md:block pt-4">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold text-white mb-1">
                {greeting()}, {sleepProfile?.name || "Abinash"}
              </h1>
              <p className="text-slate-300 text-lg">Ready for another peaceful night's rest?</p>
            </div>
            <Button variant="ghost" size="icon" className="bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 backdrop-blur-sm">
              <Settings className="text-white w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Sleep Overview Card - Enhanced mobile layout */}
        <Card className="bg-slate-900/40 backdrop-blur-md border-white/10 p-4 md:p-6 lg:p-8 rounded-2xl lg:rounded-3xl shadow-2xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 md:mb-6 space-y-3 md:space-y-0">
            <h2 className="text-xl md:text-2xl font-semibold text-white flex items-center">
              <Bed className="w-5 h-5 md:w-6 md:h-6 mr-2 md:mr-3 text-violet-300" />
              Tonight's Sleep Plan
            </h2>
            <div className="flex flex-wrap gap-2 md:gap-3">
              {chronotype?.type && (
                <Badge className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-3 py-1.5 rounded-full text-xs md:text-sm">
                  {chronotype.type} Type
                </Badge>
              )}
              {tonightsPersona && (
                <Badge className="bg-violet-500/20 text-violet-300 border border-violet-500/30 px-3 py-1.5 rounded-full text-xs md:text-sm">
                  {tonightsPersona}
                </Badge>
              )}
            </div>
          </div>
          
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 lg:gap-6">
            <div className="text-center p-3 md:p-4 bg-white/5 rounded-xl lg:rounded-2xl border border-white/10 hover:bg-white/10 transition-colors duration-300">
              <div className="text-2xl md:text-3xl font-bold text-indigo-300 mb-1">
                {sleepProfile?.bedtime || "--:--"}
              </div>
              <div className="text-xs md:text-sm text-slate-400 flex items-center justify-center">
                <Clock className="w-3 h-3 md:w-4 md:h-4 mr-1" />
                Target Bedtime
              </div>
            </div>
            <div className="text-center p-3 md:p-4 bg-white/5 rounded-xl lg:rounded-2xl border border-white/10 hover:bg-white/10 transition-colors duration-300">
              <div className="text-2xl md:text-3xl font-bold text-violet-300 mb-1">
                {sleepProfile?.duration || "--"}
              </div>
              <div className="text-xs md:text-sm text-slate-400 flex items-center justify-center">
                <Moon className="w-3 h-3 md:w-4 md:h-4 mr-1" />
                Sleep Goal
              </div>
            </div>
            <div className="text-center p-3 md:p-4 bg-white/5 rounded-xl lg:rounded-2xl border border-white/10 hover:bg-white/10 transition-colors duration-300">
              <div className="text-lg md:text-2xl font-bold text-amber-300 mb-1">
                {sleepProfile?.soundPreferences?.[0] || "Not Set"}
              </div>
              <div className="text-xs md:text-sm text-slate-400 flex items-center justify-center">
                <Headphones className="w-3 h-3 md:w-4 md:h-4 mr-1" />
                Sound Focus
              </div>
            </div>
            <div className="text-center p-3 md:p-4 bg-white/5 rounded-xl lg:rounded-2xl border border-white/10 hover:bg-white/10 transition-colors duration-300">
              <div className="text-2xl md:text-3xl font-bold text-emerald-300 mb-1 flex items-center justify-center">
                {sleepProfile?.quality || "--"}%
                <Star className="w-4 h-4 md:w-5 md:h-5 ml-1 text-yellow-400" />
              </div>
              <div className="text-xs md:text-sm text-slate-400">Sleep Quality</div>
            </div>
          </div>
        </Card>

        {/* Action Cards - Enhanced mobile responsiveness */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 lg:gap-8">
          <Card className="bg-slate-900/40 backdrop-blur-md border-white/10 p-6 md:p-8 rounded-2xl lg:rounded-3xl shadow-2xl relative overflow-hidden group hover:bg-slate-900/50 transition-all duration-300">
            <div className="absolute -right-8 -top-8 w-24 h-24 md:w-32 md:h-32 bg-violet-500/10 rounded-full blur-xl" />
            <div className="relative z-10">
              <div className="flex items-center mb-4 md:mb-6">
                <div className="w-12 h-12 md:w-14 md:h-14 bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl flex items-center justify-center mr-3 md:mr-4 shadow-lg">
                  <Sparkles className="w-6 h-6 md:w-7 md:h-7 text-white" />
                </div>
                <div>
                  <h3 className="text-lg md:text-xl font-semibold text-white">Sleep Soundscape</h3>
                  <p className="text-slate-300 text-sm">Personalized audio therapy</p>
                </div>
              </div>
              <p className="text-slate-300 mb-6 md:mb-8 leading-relaxed text-sm md:text-base">
                {tonightsPersona 
                  ? "Your custom soundscape is ready to guide you into peaceful sleep" 
                  : "Complete your evening check-in to create tonight's personalized audio therapy"}
              </p>
              <Button
                onClick={() => setLocation(tonightsPersona ? "/audio-experience" : "/daily-checkin")}
                className="w-full bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 h-11 md:h-12 rounded-xl font-medium shadow-lg transition-colors duration-300"
              >
                {tonightsPersona ? "Begin Sleep Therapy" : "Evening Check-in"}
              </Button>
            </div>
          </Card>
          
          <Card className="bg-slate-900/40 backdrop-blur-md border-white/10 p-6 md:p-8 rounded-2xl lg:rounded-3xl shadow-2xl relative overflow-hidden group hover:bg-slate-900/50 transition-all duration-300">
            <div className="absolute -right-8 -top-8 w-24 h-24 md:w-32 md:h-32 bg-amber-500/10 rounded-full blur-xl" />
            <div className="relative z-10">
              <div className="flex items-center mb-4 md:mb-6">
                <div className="w-12 h-12 md:w-14 md:h-14 bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl flex items-center justify-center mr-3 md:mr-4 shadow-lg">
                  <Heart className="w-6 h-6 md:w-7 md:h-7 text-white" />
                </div>
                <div>
                  <h3 className="text-lg md:text-xl font-semibold text-white">Sleep Monitoring</h3>
                  <p className="text-slate-300 text-sm">Track your rest patterns</p>
                </div>
              </div>
              <p className="text-slate-300 mb-6 md:mb-8 leading-relaxed text-sm md:text-base">
                Monitor your sleep cycles and wake up feeling refreshed with intelligent tracking
              </p>
              <Button
                onClick={handleStartSleep}
                className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 h-11 md:h-12 rounded-xl font-medium shadow-lg transition-colors duration-300"
              >
                Start Sleep Session
              </Button>
            </div>
          </Card>
        </div>

        {/* Tonight's Soundscapes - Enhanced mobile grid */}
        {audios.length > 0 && (
          <div>
            <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-4 md:mb-6 space-y-2 md:space-y-0">
              <h3 className="text-xl md:text-2xl font-semibold text-white flex items-center">
                <Headphones className="w-5 h-5 md:w-6 md:h-6 mr-2 md:mr-3 text-violet-300" />
                Tonight's Soundscapes
              </h3>
              <Button variant="ghost" className="text-violet-300 hover:text-violet-200 hover:bg-violet-500/20 rounded-xl self-start md:self-auto">
                Browse All Sounds
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {audios.slice(0, 3).map((audio: GeneratedAudio) => (
                <Card key={audio.id} className="bg-slate-900/40 backdrop-blur-md border-white/10 p-4 md:p-6 rounded-xl lg:rounded-2xl shadow-lg hover:bg-slate-900/50 transition-all duration-300 group cursor-pointer">
                  <div className="flex items-center space-x-3 md:space-x-4">
                    <div className="w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl lg:rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0">
                      <Headphones className="text-white w-6 h-6 md:w-8 md:h-8" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-white mb-1 truncate">{audio.title}</div>
                      <div className="text-sm text-slate-300 mb-2 line-clamp-2">{audio.description}</div>
                      <div className="text-xs text-violet-300 flex items-center">
                        <Clock className="w-3 h-3 mr-1 flex-shrink-0" />
                        {audio.duration} min session
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => playAudio && playAudio(audio)}
                      className="w-10 h-10 md:w-12 md:h-12 bg-indigo-500/20 hover:bg-indigo-500/30 rounded-xl opacity-70 md:opacity-0 group-hover:opacity-100 transition-all duration-300 shadow-lg flex-shrink-0"
                    >
                      <Play className="text-indigo-300 w-4 h-4 md:w-5 md:h-5" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Quick Access Grid - Enhanced mobile layout */}
        {/* <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          <Button 
            variant="outline" 
            className="bg-slate-900/40 border-white/10 hover:bg-slate-900/50 h-16 md:h-20 flex-col space-y-1 md:space-y-2 rounded-xl lg:rounded-2xl backdrop-blur-sm transition-colors duration-300"
            onClick={() => setLocation("/sleep-track")}
          >
            <span className="text-xl md:text-2xl">📊</span>
            <span className="text-xs md:text-sm font-medium text-white">Sleep Analytics</span>
          </Button>
          <Button 
            variant="outline" 
            className="bg-slate-900/40 border-white/10 hover:bg-slate-900/50 h-16 md:h-20 flex-col space-y-1 md:space-y-2 rounded-xl lg:rounded-2xl backdrop-blur-sm transition-colors duration-300"
            onClick={() => setLocation("/chat")}
          >
            <span className="text-xl md:text-2xl">💭</span>
            <span className="text-xs md:text-sm font-medium text-white">Sleep Journal</span>
          </Button>
          <Button 
            variant="outline" 
            className="bg-slate-900/40 border-white/10 hover:bg-slate-900/50 h-16 md:h-20 flex-col space-y-1 md:space-y-2 rounded-xl lg:rounded-2xl backdrop-blur-sm transition-colors duration-300"
            onClick={() => setLocation("/profile")}
          >
            <span className="text-xl md:text-2xl">👤</span>
            <span className="text-xs md:text-sm font-medium text-white">Sleep Profile</span>
          </Button>
          <Button 
            variant="outline" 
            className="bg-slate-900/40 border-white/10 hover:bg-slate-900/50 h-16 md:h-20 flex-col space-y-1 md:space-y-2 rounded-xl lg:rounded-2xl backdrop-blur-sm transition-colors duration-300"
            onClick={() => setLocation("/questionnaire")}
          >
            <span className="text-xl md:text-2xl">🧬</span>
            <span className="text-xs md:text-sm font-medium text-white">Sleep Type</span>
          </Button>
        </div> */}
      </div>
    </AppLayout>
  );
}
