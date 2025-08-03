import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";

const soundOptions = [
  { id: "nature", label: "Nature Sounds", description: "Rain, ocean, forest" },
  { id: "white_noise", label: "White Noise", description: "Consistent, gentle sounds" },
  { id: "asmr", label: "ASMR", description: "Soft whispers and tingles" },
  { id: "ambient", label: "Ambient", description: "Ethereal, atmospheric tones" }
];

const challengeOptions = [
  { id: "A", label: "Trouble falling asleep" },
  { id: "B", label: "Waking up a lot during the night" },
  { id: "C", label: "Waking up too early" },
  { id: "D", label: "I sleep, but I still feel tired" }
];

export default function SleepProfileForm({ onComplete }: { onComplete: (profile: any) => void }) {
  const [bedtime, setBedtime] = useState("22:30");
  const [wakeTime, setWakeTime] = useState("06:30");
  const [preferredDuration, setPreferredDuration] = useState(480); // 8 hours
  const [soundPreferences, setSoundPreferences] = useState<string[]>([]);
  const [biggestChallenge, setBiggestChallenge] = useState("");
  
  const toggleSoundPreference = (id: string) => {
    if (soundPreferences.includes(id)) {
      setSoundPreferences(soundPreferences.filter(s => s !== id));
    } else {
      setSoundPreferences([...soundPreferences, id]);
    }
  };

  const handleSubmit = () => {
    onComplete({
      bedtime,
      wakeTime,
      preferredDuration,
      soundPreferences,
      biggestChallenge
    });
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins > 0 ? `${mins}m` : ''}`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-white mb-4">Your Sleep Schedule</h2>
        
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="bedtime" className="text-gray-300 mb-2 block">
              Bedtime
            </Label>
            <Input
              id="bedtime"
              type="time"
              value={bedtime}
              onChange={(e) => setBedtime(e.target.value)}
              className="bg-white/10 border-white/20 text-white"
            />
          </div>
          
          <div>
            <Label htmlFor="wakeTime" className="text-gray-300 mb-2 block">
              Wake Time
            </Label>
            <Input
              id="wakeTime"
              type="time"
              value={wakeTime}
              onChange={(e) => setWakeTime(e.target.value)}
              className="bg-white/10 border-white/20 text-white"
            />
          </div>
        </div>
      </div>
      
      <div>
        <Label className="text-gray-300 mb-2 block">
          Preferred Sleep Duration: {formatDuration(preferredDuration)}
        </Label>
        <Slider
          value={[preferredDuration]}
          onValueChange={([value]) => setPreferredDuration(value)}
          min={240}
          max={600}
          step={30}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-gray-400 mt-2">
          <span>4h</span>
          <span>8h</span>
          <span>10h</span>
        </div>
      </div>
      
      <div>
        <h2 className="text-xl font-semibold text-white mb-4">Sound Preferences</h2>
        <p className="text-gray-300 mb-4">Select sounds you enjoy (choose multiple):</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {soundOptions.map(option => (
            <div 
              key={option.id}
              className={`p-4 rounded-lg cursor-pointer transition-all ${
                soundPreferences.includes(option.id)
                  ? "bg-purple-500/20 border border-purple-500"
                  : "bg-white/5 border border-white/10 hover:bg-white/10"
              }`}
              onClick={() => toggleSoundPreference(option.id)}
            >
              <div className="font-medium text-white">{option.label}</div>
              <div className="text-sm text-gray-300">{option.description}</div>
            </div>
          ))}
        </div>
      </div>
      
      <div>
        <h2 className="text-xl font-semibold text-white mb-4">Sleep Challenges</h2>
        <p className="text-gray-300 mb-4">What is your biggest challenge with sleep?</p>
        <div className="space-y-3">
          {challengeOptions.map(option => (
            <div 
              key={option.id}
              className={`p-4 rounded-lg cursor-pointer transition-all ${
                biggestChallenge === option.id
                  ? "bg-purple-500/20 border border-purple-500"
                  : "bg-white/5 border border-white/10 hover:bg-white/10"
              }`}
              onClick={() => setBiggestChallenge(option.id)}
            >
              <div className="font-medium text-white">{option.label}</div>
            </div>
          ))}
        </div>
      </div>
      
      <Button 
        className="w-full bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700"
        onClick={handleSubmit}
        disabled={!biggestChallenge}
      >
        Continue
      </Button>
    </div>
  );
}