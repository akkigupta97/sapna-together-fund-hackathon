import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AudioProvider } from "@/lib/audio-context";
import { queryClient } from "./lib/queryClient";

import Home from "@/pages/home";
import SleepTrack from "@/pages/sleep-track";
import Chat from "@/pages/chat";
import Profile from "@/pages/profile";
import DailyCheckIn from "@/pages/daily-checkin";
import AudioExperience from "@/pages/audio-experience";
import VideoExperience from "@/pages/video-experience";
import UnifiedOnboarding from "@/pages/unified-onboarding";
import NotFound from "@/pages/not-found";
import SoundGeneratorPage from "@/pages/sound-generator";
import PodcastMeditationPage from "@/pages/podcast-meditation";
import PrivacyPage from "@/pages/privacy";
import HelpPage from "@/pages/help";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/sound-generator" component={SoundGeneratorPage} />
      <Route path="/sleep-track" component={SleepTrack} />
      <Route path="/chat" component={Chat} />
      <Route path="/profile" component={Profile} />
      <Route path="/privacy" component={PrivacyPage} />
      <Route path="/help" component={HelpPage} />
      <Route path="/onboarding" component={UnifiedOnboarding} />
      <Route path="/daily-checkin" component={DailyCheckIn} />
      <Route path="/audio-experience" component={AudioExperience} />
      <Route path="/video-experience" component={VideoExperience} />
      <Route path="/podcast-meditation" component={PodcastMeditationPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AudioProvider>
          <Toaster />
          <Router />
        </AudioProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;