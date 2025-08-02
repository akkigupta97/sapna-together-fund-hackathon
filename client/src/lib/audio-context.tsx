import { createContext, useContext, useState, ReactNode } from "react";
import AudioPlayerModal from "@/components/audio/audio-player-modal";
import type { GeneratedAudio } from "@shared/schema";

interface AudioContextType {
  currentAudio: GeneratedAudio | null;
  isPlayerOpen: boolean;
  playAudio: (audio: GeneratedAudio) => void;
  closePlayer: () => void;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

export function AudioProvider({ children }: { children: ReactNode }) {
  const [currentAudio, setCurrentAudio] = useState<GeneratedAudio | null>(null);
  const [isPlayerOpen, setIsPlayerOpen] = useState(false);

  const playAudio = (audio: GeneratedAudio) => {
    setCurrentAudio(audio);
    setIsPlayerOpen(true);
  };

  const closePlayer = () => {
    setIsPlayerOpen(false);
    // Keep currentAudio for potential resume
  };

  return (
    <AudioContext.Provider value={{ currentAudio, isPlayerOpen, playAudio, closePlayer }}>
      {children}
      <AudioPlayerModal
        audio={currentAudio}
        isOpen={isPlayerOpen}
        onClose={closePlayer}
      />
    </AudioContext.Provider>
  );
}

export function useAudio() {
  const context = useContext(AudioContext);
  if (context === undefined) {
    throw new Error("useAudio must be used within an AudioProvider");
  }
  return context;
}
