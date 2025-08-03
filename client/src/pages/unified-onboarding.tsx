import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import SleepProfileForm from "./sleep-profile-form";
import ChronotypeQuestionnaire from "./chronotype-questionnaire";
import OnboardingComplete from "./onboarding-complete";

export default function UnifiedOnboarding() {
  const [step, setStep] = useState(0);
  const [sleepProfile, setSleepProfile] = useState<any>(null);
  const [chronotype, setChronotype] = useState<any>(null);
  const [location, setLocation] = useLocation();

  const steps = [
    {
      title: "Sleep Profile",
      component: (
        <SleepProfileForm 
          onComplete={(profile) => {
            setSleepProfile(profile);
            setStep(1);
          }} 
        />
      )
    },
    {
      title: "Sleep Chronotype",
      component: (
        <ChronotypeQuestionnaire 
          onComplete={(result) => {
            setChronotype(result);
            setStep(2);
          }} 
        />
      )
    },
    {
      title: "Complete Setup",
      component: (
        <OnboardingComplete 
          sleepProfile={sleepProfile} 
          chronotype={chronotype} 
          onFinish={() => {
            // Save data to local storage
            localStorage.setItem("sleepProfile", JSON.stringify(sleepProfile));
            localStorage.setItem("chronotype", JSON.stringify(chronotype));
            setLocation("/");
          }}
        />
      )
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 text-center">
          <div className="flex justify-center mb-6">
            {steps.map((_, i) => (
              <div 
                key={i} 
                className={`w-8 h-1 mx-1 rounded-full ${
                  i <= step ? "bg-purple-500" : "bg-gray-700"
                }`}
              />
            ))}
          </div>
          
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
            {steps[step].title}
          </h1>
          <p className="text-gray-400">
            Step {step + 1} of {steps.length}
          </p>
        </div>
        
        <div className="glass-card p-6 rounded-2xl">
          {steps[step].component}
        </div>
      </div>
    </div>
  );
}
