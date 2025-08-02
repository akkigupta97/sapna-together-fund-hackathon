import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";

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
  { id: "basics", title: "Sleep Schedule", description: "When do you usually sleep?" },
  { id: "preferences", title: "Sound Preferences", description: "What helps you relax?" },
  { id: "environment", title: "Sleep Environment", description: "Tell us about your space" },
  { id: "wellness", title: "Sleep Wellness", description: "Help us understand your needs" }
];

const soundOptions = [
  { id: "nature", label: "Nature Sounds", description: "Rain, ocean, forest" },
  { id: "white_noise", label: "White Noise", description: "Consistent, gentle sounds" },
  { id: "asmr", label: "ASMR", description: "Soft whispers and tingles" },
  { id: "ambient", label: "Ambient", description: "Ethereal, atmospheric tones" }
];

const environmentOptions = [
  { id: "quiet", label: "Quiet", description: "Naturally peaceful environment" },
  { id: "city", label: "City", description: "Urban noise, need masking sounds" },
  { id: "rural", label: "Rural", description: "Countryside, natural sounds" }
];

const sleepIssueOptions = [
  { id: "trouble_falling_asleep", label: "Trouble falling asleep" },
  { id: "frequent_waking", label: "Frequent night waking" },
  { id: "early_waking", label: "Waking up too early" },
  { id: "restless_sleep", label: "Restless or light sleep" },
  { id: "stress_anxiety", label: "Stress and anxiety" }
];

export default function Onboarding() {
  const [currentStep, setCurrentStep] = useState(0);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const userId = localStorage.getItem("currentUserId") || "demo-user-123";

  const [data, setData] = useState<OnboardingData>({
    bedtime: "22:30",
    wakeTime: "06:30",
    preferredDuration: 480, // 8 hours
    soundPreferences: [],
    sleepEnvironment: "",
    stressLevel: 5,
    sleepIssues: []
  });

  const saveSleepProfileMutation = useMutation({
    mutationFn: (profileData: any) =>
      apiRequest("POST", "/api/sleep-profile", { userId, ...profileData }),
    onSuccess: () => {
      // Also update user as onboarded
      apiRequest("PATCH", `/api/users/${userId}`, { onboardingCompleted: true });
      queryClient.invalidateQueries({ queryKey: ["/api/sleep-profile", userId] });
      queryClient.invalidateQueries({ queryKey: ["/api/users", userId] });
      
      toast({
        title: "Profile created successfully!",
        description: "Your personalized sleep profile is ready.",
      });
      setLocation("/");
    },
    onError: () => {
      toast({
        title: "Failed to save profile",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  });

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      saveSleepProfileMutation.mutate(data);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    } else {
      setLocation("/");
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

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="bedtime" className="text-gray-300">Preferred Bedtime</Label>
                <Input
                  id="bedtime"
                  type="time"
                  value={data.bedtime}
                  onChange={(e) => updateData({ bedtime: e.target.value })}
                  className="glass-button border-white/20 text-white mt-2"
                />
              </div>
              <div>
                <Label htmlFor="wakeTime" className="text-gray-300">Preferred Wake Time</Label>
                <Input
                  id="wakeTime"
                  type="time"
                  value={data.wakeTime}
                  onChange={(e) => updateData({ wakeTime: e.target.value })}
                  className="glass-button border-white/20 text-white mt-2"
                />
              </div>
              <div>
                <Label className="text-gray-300">
                  Preferred Sleep Duration: {Math.floor(data.preferredDuration / 60)}h {data.preferredDuration % 60}m
                </Label>
                <Slider
                  value={[data.preferredDuration]}
                  onValueChange={([value]) => updateData({ preferredDuration: value })}
                  max={600}
                  min={240}
                  step={15}
                  className="mt-4"
                />
              </div>
            </div>
          </div>
        );

      case 1:
        return (
          <div className="space-y-4">
            <p className="text-gray-300 text-sm">Select your preferred sleep sounds (choose multiple):</p>
            {soundOptions.map((option) => (
              <Card
                key={option.id}
                className={`glass-card p-4 cursor-pointer transition-all duration-300 ${
                  data.soundPreferences.includes(option.id) ? "ring-2 ring-soft-indigo" : ""
                }`}
                onClick={() => updateData({
                  soundPreferences: toggleArrayItem(data.soundPreferences, option.id)
                })}
              >
                <div className="flex items-center space-x-3">
                  <Checkbox
                    checked={data.soundPreferences.includes(option.id)}
                    readOnly
                  />
                  <div>
                    <div className="font-medium">{option.label}</div>
                    <div className="text-sm text-gray-400">{option.description}</div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <p className="text-gray-300 text-sm">What's your sleep environment like?</p>
            {environmentOptions.map((option) => (
              <Card
                key={option.id}
                className={`glass-card p-4 cursor-pointer transition-all duration-300 ${
                  data.sleepEnvironment === option.id ? "ring-2 ring-soft-indigo" : ""
                }`}
                onClick={() => updateData({ sleepEnvironment: option.id })}
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-4 h-4 rounded-full border-2 ${
                    data.sleepEnvironment === option.id ? "bg-soft-indigo border-soft-indigo" : "border-gray-400"
                  }`} />
                  <div>
                    <div className="font-medium">{option.label}</div>
                    <div className="text-sm text-gray-400">{option.description}</div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div>
              <Label className="text-gray-300">
                Stress Level (1-10): {data.stressLevel}
              </Label>
              <Slider
                value={[data.stressLevel]}
                onValueChange={([value]) => updateData({ stressLevel: value })}
                max={10}
                min={1}
                step={1}
                className="mt-4"
              />
            </div>
            <div>
              <Label className="text-gray-300 block mb-4">Any sleep challenges? (optional)</Label>
              <div className="space-y-3">
                {sleepIssueOptions.map((issue) => (
                  <Card
                    key={issue.id}
                    className={`glass-card p-3 cursor-pointer transition-all duration-300 ${
                      data.sleepIssues.includes(issue.id) ? "ring-2 ring-soft-indigo" : ""
                    }`}
                    onClick={() => updateData({
                      sleepIssues: toggleArrayItem(data.sleepIssues, issue.id)
                    })}
                  >
                    <div className="flex items-center space-x-3">
                      <Checkbox
                        checked={data.sleepIssues.includes(issue.id)}
                        readOnly
                      />
                      <span className="text-sm">{issue.label}</span>
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
    <div className="min-h-screen p-4 md:p-6">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <Button variant="ghost" size="icon" onClick={handleBack}>
              <ArrowLeft className="text-white" />
            </Button>
            <div className="text-sm text-gray-400">
              {currentStep + 1} of {steps.length}
            </div>
          </div>
          <div className="mb-4">
            <div className="flex space-x-2">
              {steps.map((_, index) => (
                <div
                  key={index}
                  className={`h-2 rounded-full flex-1 transition-colors duration-300 ${
                    index <= currentStep ? "bg-soft-indigo" : "bg-gray-600"
                  }`}
                />
              ))}
            </div>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">
            {steps[currentStep].title}
          </h1>
          <p className="text-gray-300">
            {steps[currentStep].description}
          </p>
        </div>

        {/* Step Content */}
        <Card className="glass-card p-6 mb-8">
          {renderStep()}
        </Card>

        {/* Navigation */}
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={handleBack}
            className="glass-button border-white/20 text-white"
          >
            Back
          </Button>
          <Button
            onClick={handleNext}
            disabled={!canProceed() || saveSleepProfileMutation.isPending}
            className="gradient-purple"
          >
            {saveSleepProfileMutation.isPending ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : currentStep === steps.length - 1 ? (
              <>
                <Check className="mr-2" />
                Complete
              </>
            ) : (
              <>
                Next
                <ArrowRight className="ml-2" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
