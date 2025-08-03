import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, ArrowRight, Check, Clock, Volume2, Moon, Heart, CheckCircle } from "lucide-react";

interface OnboardingData {
  bedtime: string;
  wakeTime: string;
  preferredDuration: number;
  soundPreferences: string[];
  sleepEnvironment: string;
  stressLevel: number;
  sleepIssues: string[];
}

const steps = [
  { 
    id: "basics", 
    title: "Sleep Schedule", 
    description: "When do you usually sleep?",
    icon: Clock,
    color: "from-blue-500 to-cyan-500"
  },
  { 
    id: "preferences", 
    title: "Sound Preferences", 
    description: "What helps you relax?",
    icon: Volume2,
    color: "from-purple-500 to-indigo-500"
  },
  { 
    id: "environment", 
    title: "Sleep Environment", 
    description: "Tell us about your space",
    icon: Moon,
    color: "from-indigo-500 to-purple-500"
  },
  { 
    id: "wellness", 
    title: "Sleep Wellness", 
    description: "Help us understand your needs",
    icon: Heart,
    color: "from-pink-500 to-rose-500"
  }
];

const soundOptions = [
  { id: "nature", label: "Nature Sounds", description: "Rain, ocean, forest", emoji: "🌊" },
  { id: "white_noise", label: "White Noise", description: "Consistent, gentle sounds", emoji: "🔊" },
  { id: "asmr", label: "ASMR", description: "Soft whispers and tingles", emoji: "🎧" },
  { id: "ambient", label: "Ambient", description: "Ethereal, atmospheric tones", emoji: "✨" }
];

const environmentOptions = [
  { id: "quiet", label: "Quiet", description: "Naturally peaceful environment", emoji: "🤫" },
  { id: "city", label: "City", description: "Urban noise, need masking sounds", emoji: "🏙️" },
  { id: "rural", label: "Rural", description: "Countryside, natural sounds", emoji: "🌲" }
];

const sleepIssueOptions = [
  { id: "trouble_falling_asleep", label: "Trouble falling asleep", emoji: "😴" },
  { id: "frequent_waking", label: "Frequent night waking", emoji: "😵" },
  { id: "early_waking", label: "Waking up too early", emoji: "🌅" },
  { id: "restless_sleep", label: "Restless or light sleep", emoji: "😣" },
  { id: "stress_anxiety", label: "Stress and anxiety", emoji: "😰" }
];

export default function Onboarding() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const [data, setData] = useState<OnboardingData>({
    bedtime: "22:30",
    wakeTime: "06:30",
    preferredDuration: 480, // 8 hours
    soundPreferences: [],
    sleepEnvironment: "",
    stressLevel: 5,
    sleepIssues: []
  });

  const handleNext = async () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      setIsLoading(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      setIsLoading(false);
      alert("Onboarding completed! Profile saved successfully.");
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    } else {
      alert("Going back to home");
    }
  };

  const updateData = (updates: Partial<OnboardingData>) => {
    setData({ ...data, ...updates });
  };

  const toggleArrayItem = <T extends string>(array: T[], item: T): T[] => {
    return array.includes(item)
      ? array.filter(i => i !== item)
      : [...array, item];
  };

  const canProceed = () => {
    switch (currentStep) {
      case 0:
        return data.bedtime && data.wakeTime;
      case 1:
        return data.soundPreferences.length > 0;
      case 2:
        return data.sleepEnvironment;
      case 3:
        return true; // Optional step
      default:
        return false;
    }
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins > 0 ? `${mins}m` : ''}`;
  };

  const getStressLevelColor = (level: number) => {
    if (level <= 3) return "from-green-500 to-emerald-500";
    if (level <= 6) return "from-yellow-500 to-orange-500";
    return "from-orange-500 to-red-500";
  };

  const getStressLevelText = (level: number) => {
    if (level <= 3) return "Low stress";
    if (level <= 6) return "Moderate stress";
    return "High stress";
  };

  const progress = ((currentStep + 1) / steps.length) * 100;
  const currentStepInfo = steps[currentStep];
  const StepIcon = currentStepInfo.icon;

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-6">
            <div className="grid gap-6">
              <div className="space-y-3">
                <Label htmlFor="bedtime" className="text-slate-700 font-medium text-base">
                  Preferred Bedtime
                </Label>
                <Input
                  id="bedtime"
                  type="time"
                  value={data.bedtime}
                  onChange={(e) => updateData({ bedtime: e.target.value })}
                  className="h-12 text-lg border-2 border-slate-200 focus:border-blue-500 rounded-lg"
                />
              </div>
              
              <div className="space-y-3">
                <Label htmlFor="wakeTime" className="text-slate-700 font-medium text-base">
                  Preferred Wake Time
                </Label>
                <Input
                  id="wakeTime"
                  type="time"
                  value={data.wakeTime}
                  onChange={(e) => updateData({ wakeTime: e.target.value })}
                  className="h-12 text-lg border-2 border-slate-200 focus:border-blue-500 rounded-lg"
                />
              </div>
              
              <div className="space-y-4">
                <Label className="text-slate-700 font-medium text-base">
                  Preferred Sleep Duration: <span className="font-bold text-blue-600">{formatDuration(data.preferredDuration)}</span>
                </Label>
                <div className="px-3">
                  <Slider
                    value={[data.preferredDuration]}
                    onValueChange={([value]) => updateData({ preferredDuration: value })}
                    max={600}
                    min={240}
                    step={15}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-slate-500 mt-2">
                    <span>4h</span>
                    <span>6h</span>
                    <span>8h</span>
                    <span>10h</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 1:
        return (
          <div className="space-y-4">
            <p className="text-slate-600 mb-6">Select your preferred sleep sounds (choose multiple):</p>
            <div className="grid gap-3">
              {soundOptions.map((option) => (
                <Card
                  key={option.id}
                  className={`p-4 cursor-pointer transition-all duration-300 hover:shadow-md border-2 ${
                    data.soundPreferences.includes(option.id) 
                      ? "border-purple-500 bg-purple-50 shadow-lg" 
                      : "border-slate-200 hover:border-purple-300 bg-white"
                  }`}
                  onClick={() => updateData({
                    soundPreferences: toggleArrayItem(data.soundPreferences, option.id)
                  })}
                >
                  <div className="flex items-center space-x-4">
                    <div className="text-2xl">{option.emoji}</div>
                    <div className="flex-1">
                      <div className="font-semibold text-slate-800 text-base">{option.label}</div>
                      <div className="text-sm text-slate-600">{option.description}</div>
                    </div>
                    {data.soundPreferences.includes(option.id) && (
                      <CheckCircle className="w-6 h-6 text-purple-500" />
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <p className="text-slate-600 mb-6">What's your sleep environment like?</p>
            <div className="grid gap-3">
              {environmentOptions.map((option) => (
                <Card
                  key={option.id}
                  className={`p-4 cursor-pointer transition-all duration-300 hover:shadow-md border-2 ${
                    data.sleepEnvironment === option.id 
                      ? "border-indigo-500 bg-indigo-50 shadow-lg" 
                      : "border-slate-200 hover:border-indigo-300 bg-white"
                  }`}
                  onClick={() => updateData({ sleepEnvironment: option.id })}
                >
                  <div className="flex items-center space-x-4">
                    <div className="text-2xl">{option.emoji}</div>
                    <div className="flex-1">
                      <div className="font-semibold text-slate-800 text-base">{option.label}</div>
                      <div className="text-sm text-slate-600">{option.description}</div>
                    </div>
                    {data.sleepEnvironment === option.id && (
                      <CheckCircle className="w-6 h-6 text-indigo-500" />
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-8">
            <div className="space-y-6">
              <div>
                <Label className="text-slate-700 font-medium text-base block mb-3">
                  Current Stress Level: <span className="font-bold">{data.stressLevel}/10</span>
                  <span className={`ml-2 px-3 py-1 rounded-full text-sm font-medium bg-gradient-to-r ${getStressLevelColor(data.stressLevel)} text-white`}>
                    {getStressLevelText(data.stressLevel)}
                  </span>
                </Label>
                <div className="px-3">
                  <Slider
                    value={[data.stressLevel]}
                    onValueChange={([value]) => updateData({ stressLevel: value })}
                    max={10}
                    min={1}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-slate-500 mt-2">
                    <span>Very Low</span>
                    <span>Moderate</span>
                    <span>Very High</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div>
              <Label className="text-slate-700 font-medium text-base block mb-4">
                Any sleep challenges? <span className="text-slate-500 font-normal">(optional)</span>
              </Label>
              <div className="grid gap-3">
                {sleepIssueOptions.map((issue) => (
                  <Card
                    key={issue.id}
                    className={`p-3 cursor-pointer transition-all duration-300 hover:shadow-md border-2 ${
                      data.sleepIssues.includes(issue.id) 
                        ? "border-pink-500 bg-pink-50 shadow-lg" 
                        : "border-slate-200 hover:border-pink-300 bg-white"
                    }`}
                    onClick={() => updateData({
                      sleepIssues: toggleArrayItem(data.sleepIssues, issue.id)
                    })}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="text-xl">{issue.emoji}</div>
                      <span className="text-slate-800 font-medium">{issue.label}</span>
                      {data.sleepIssues.includes(issue.id) && (
                        <CheckCircle className="w-5 h-5 text-pink-500 ml-auto" />
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-4 md:p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleBack}
              className="h-12 w-12 rounded-full bg-white/80 hover:bg-white shadow-md text-slate-600 hover:text-slate-800"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="text-sm font-medium text-slate-600 bg-white/80 px-3 py-2 rounded-full">
              {currentStep + 1} of {steps.length}
            </div>
          </div>
          
          <Progress 
            value={progress} 
            className="mb-6 h-3 bg-white/60 rounded-full overflow-hidden"
          />
          
          <div className="text-center mb-6">
            <div className={`w-20 h-20 rounded-full bg-gradient-to-r ${currentStepInfo.color} flex items-center justify-center mx-auto mb-4 shadow-lg`}>
              <StepIcon className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-slate-800 mb-2">
              {currentStepInfo.title}
            </h1>
            <p className="text-slate-600 text-lg">
              {currentStepInfo.description}
            </p>
          </div>
        </div>

        {/* Step Content */}
        <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl p-6 md:p-8 mb-8 rounded-2xl">
          {renderStep()}
        </Card>

        {/* Navigation */}
        <div className="flex justify-between gap-4">
          <Button
            variant="outline"
            onClick={handleBack}
            className="border-2 border-slate-300 text-slate-700 hover:bg-slate-50 bg-white/80 px-6 py-3 h-auto rounded-xl font-medium"
            disabled={isLoading}
          >
            <ArrowLeft className="mr-2 w-4 h-4" />
            {currentStep === 0 ? "Home" : "Back"}
          </Button>
          
          <Button
            onClick={handleNext}
            disabled={!canProceed() || isLoading}
            className={`bg-gradient-to-r ${currentStepInfo.color} hover:opacity-90 text-white px-6 py-3 h-auto rounded-xl font-medium shadow-lg disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isLoading ? (
              <div className="flex items-center">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Saving...
              </div>
            ) : currentStep === steps.length - 1 ? (
              <>
                <Check className="mr-2 w-4 h-4" />
                Complete Setup
              </>
            ) : (
              <>
                Next Step
                <ArrowRight className="ml-2 w-4 h-4" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
