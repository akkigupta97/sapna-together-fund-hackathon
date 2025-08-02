import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AudioProvider } from "@/lib/audio-context";
import { useEffect, useState } from "react";

import Home from "@/pages/home";
import SleepTrack from "@/pages/sleep-track";
import Chat from "@/pages/chat";
import Profile from "@/pages/profile";
import Onboarding from "@/pages/onboarding";
import NotFound from "@/pages/not-found";

function Router() {
  const [currentUser, setCurrentUser] = useState<string | null>(null);

  useEffect(() => {
    // For MVP, create a default user
    // In production, this would handle proper authentication
    const defaultUserId = "demo-user-123";
    setCurrentUser(defaultUserId);
    
    // Store user ID in localStorage for persistence
    localStorage.setItem("currentUserId", defaultUserId);
  }, []);

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-soft-indigo border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-300">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/sleep-track" component={SleepTrack} />
      <Route path="/chat" component={Chat} />
      <Route path="/profile" component={Profile} />
      <Route path="/onboarding" component={Onboarding} />
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
