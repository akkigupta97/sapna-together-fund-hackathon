import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { calculateNightlyPersona } from "@/lib/sleep-utils";
import { Moon, Sparkles } from "lucide-react";

const stressOptions = [
  { 
    id: "low", 
    label: "Relaxed", 
    emoji: "😌", 
    color: "from-emerald-500 to-teal-500", 
    desc: "Feeling calm and peaceful" 
  },
  { 
    id: "medium", 
    label: "Moderate", 
    emoji: "😐", 
    color: "from-amber-500 to-yellow-500", 
    desc: "Some tension but manageable" 
  },
  { 
    id: "high", 
    label: "Intense", 
    emoji: "😰", 
    color: "from-red-500 to-pink-500", 
    desc: "High stress and tension" 
  }
];

const thoughtsOptions = [
  { 
    id: "calm", 
    label: "Peaceful", 
    emoji: "🌊", 
    color: "from-blue-500 to-cyan-500", 
    desc: "Mind feels quiet and still" 
  },
  { 
    id: "busy", 
    label: "Active", 
    emoji: "🌀", 
    color: "from-purple-500 to-violet-500", 
    desc: "Thoughts are flowing but manageable" 
  },
  { 
    id: "racing", 
    label: "Racing", 
    emoji: "⚡", 
    color: "from-orange-500 to-red-500", 
    desc: "Mind feels very busy and restless" 
  }
];

export default function DailyCheckIn() {
  const [stressLevel, setStressLevel] = useState<string | null>(null);
  const [thoughtsState, setThoughtsState] = useState<string | null>(null);
  const [persona, setPersona] = useState<string | null>(null);
  const [location, setLocation] = useLocation();

  const handleSubmit = () => {
    if (!stressLevel || !thoughtsState) return;
    
    // Get permanent sleep profile
    const sleepProfile = JSON.parse(localStorage.getItem("sleepProfile") || "{}");
    const biggestChallenge = sleepProfile?.biggestChallenge || "A";
    
    // Calculate nightly persona
    const nightlyPersona = calculateNightlyPersona(
      biggestChallenge,
      stressLevel,
      thoughtsState
    );
    
    setPersona(nightlyPersona);
    
    // Save to local storage for tonight
    localStorage.setItem("tonightsPersona", nightlyPersona);
    
    // Navigate to audio experience after a short delay
    setTimeout(() => setLocation("/audio-experience"), 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4 md:p-6 flex items-center justify-center">
      <div className="max-w-lg w-full">
        <Card className="bg-white/10 backdrop-blur-md border-white/20 p-8 rounded-3xl shadow-2xl">
          {!persona ? (
            <>
              <div className="text-center mb-10">
                <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <Moon className="w-10 h-10 text-white" />
                </div>
                <h1 className="text-3xl font-bold text-white mb-3">Evening Wind-Down</h1>
                <p className="text-gray-300 text-lg">Let's create the perfect sleep atmosphere for you</p>
              </div>
              
              <div className="space-y-10">
                <div>
                  <h2 className="text-xl font-medium text-white mb-6 text-center">How was your stress level today?</h2>
                  <div className="grid grid-cols-1 gap-4">
                    {stressOptions.map(option => (
                      <Button
                        key={option.id}
                        variant={stressLevel === option.id ? "default" : "outline"}
                        className={`h-20 flex items-center justify-start p-6 text-left transition-all duration-300 rounded-2xl ${
                          stressLevel === option.id 
                            ? `bg-gradient-to-r ${option.color} border-0 shadow-lg transform scale-105` 
                            : "bg-white/5 border-white/20 hover:bg-white/10"
                        }`}
                        onClick={() => setStressLevel(option.id)}
                      >
                        <span className="text-3xl mr-4">{option.emoji}</span>
                        <div>
                          <div className="font-semibold text-lg">{option.label}</div>
                          <div className="text-sm opacity-90">{option.desc}</div>
                        </div>
                      </Button>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h2 className="text-xl font-medium text-white mb-6 text-center">How are your thoughts feeling right now?</h2>
                  <div className="grid grid-cols-1 gap-4">
                    {thoughtsOptions.map(option => (
                      <Button
                        key={option.id}
                        variant={thoughtsState === option.id ? "default" : "outline"}
                        className={`h-20 flex items-center justify-start p-6 text-left transition-all duration-300 rounded-2xl ${
                          thoughtsState === option.id 
                            ? `bg-gradient-to-r ${option.color} border-0 shadow-lg transform scale-105` 
                            : "bg-white/5 border-white/20 hover:bg-white/10"
                        }`}
                        onClick={() => setThoughtsState(option.id)}
                      >
                        <span className="text-3xl mr-4">{option.emoji}</span>
                        <div>
                          <div className="font-semibold text-lg">{option.label}</div>
                          <div className="text-sm opacity-90">{option.desc}</div>
                        </div>
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
              
              <Button
                className="w-full mt-10 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 h-14 text-lg font-medium rounded-2xl shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleSubmit}
                disabled={!stressLevel || !thoughtsState}
              >
                Create Tonight's Sleep Experience
              </Button>
            </>
          ) : (
            <div className="text-center py-12">
              <div className="w-24 h-24 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-lg">
                <Sparkles className="text-white w-12 h-12" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-4">Your Sleep Experience Tonight</h2>
              <Badge className="text-lg py-3 px-8 bg-gradient-to-r from-purple-500 to-indigo-600 border-0 rounded-2xl shadow-lg">
                {persona}
              </Badge>
              <p className="text-gray-300 mt-6 text-lg">Crafting your personalized sleep therapy...</p>
              <div className="mt-8 w-16 h-16 border-4 border-white/20 border-t-white rounded-full animate-spin mx-auto" />
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
