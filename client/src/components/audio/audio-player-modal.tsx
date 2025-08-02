import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { 
  X, 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Clock, 
  Heart,
  Volume2
} from "lucide-react";
import type { GeneratedAudio } from "@shared/schema";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface AudioPlayerModalProps {
  audio: GeneratedAudio | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function AudioPlayerModal({ audio, isOpen, onClose }: AudioPlayerModalProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.7);
  const [timer, setTimer] = useState<number | null>(null);
  const queryClient = useQueryClient();
  const userId = localStorage.getItem("currentUserId") || "demo-user-123";

  const toggleFavoriteMutation = useMutation({
    mutationFn: () =>
      apiRequest("PATCH", `/api/audios/${audio?.id}`, {
        isFavorite: !audio?.isFavorite
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/audios", userId] });
    },
  });

  const incrementPlayCountMutation = useMutation({
    mutationFn: () =>
      apiRequest("PATCH", `/api/audios/${audio?.id}`, {
        playCount: (audio?.playCount || 0) + 1
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/audios", userId] });
    },
  });

  useEffect(() => {
    if (audio && isPlaying) {
      incrementPlayCountMutation.mutate();
    }
  }, [isPlaying, audio?.id]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleTogglePlay = () => {
    setIsPlaying(!isPlaying);
    // In a real implementation, this would control actual audio playback
  };

  const handleSeek = (value: number[]) => {
    setCurrentTime(value[0]);
    // In a real implementation, this would seek the audio
  };

  const handleVolumeChange = (value: number[]) => {
    setVolume(value[0]);
    // In a real implementation, this would control audio volume
  };

  const setAudioTimer = (minutes: number) => {
    setTimer(minutes);
    // In a real implementation, this would set an audio sleep timer
  };

  const toggleFavorite = () => {
    if (audio) {
      toggleFavoriteMutation.mutate();
    }
  };

  if (!isOpen || !audio) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end md:items-center justify-center z-50">
      <Card className="glass-card w-full md:max-w-md md:mx-4 rounded-t-3xl md:rounded-3xl p-6 border border-white/20">
        {/* Close Button */}
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold">Now Playing</h3>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={onClose}
            className="w-8 h-8 glass-button rounded-full hover:bg-white/20"
          >
            <X className="text-white" />
          </Button>
        </div>

        {/* Audio Visualization */}
        <div className="text-center mb-6">
          <div className="w-32 h-32 bg-gradient-to-br from-soft-indigo to-soft-purple rounded-2xl mx-auto mb-4 flex items-center justify-center">
            <div className="text-4xl">🎵</div>
          </div>
          <h4 className="text-xl font-semibold mb-1">{audio.title}</h4>
          <p className="text-gray-300 text-sm">{audio.description}</p>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between text-sm text-gray-300 mb-2">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(audio.duration || 2700)}</span>
          </div>
          <Slider
            value={[currentTime]}
            onValueChange={handleSeek}
            max={audio.duration || 2700}
            step={1}
            className="w-full"
          />
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center space-x-6 mb-6">
          <Button
            variant="ghost"
            size="icon"
            className="w-12 h-12 glass-button rounded-full hover:bg-white/20"
          >
            <SkipBack className="text-white" />
          </Button>
          <Button
            onClick={handleTogglePlay}
            className="w-16 h-16 gradient-purple rounded-full hover:scale-105 transition-transform duration-300"
          >
            {isPlaying ? (
              <Pause className="text-white text-xl" />
            ) : (
              <Play className="text-white text-xl" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="w-12 h-12 glass-button rounded-full hover:bg-white/20"
          >
            <SkipForward className="text-white" />
          </Button>
        </div>

        {/* Volume Control */}
        <div className="mb-6">
          <div className="flex items-center space-x-3">
            <Volume2 className="text-gray-300" />
            <Slider
              value={[volume]}
              onValueChange={handleVolumeChange}
              max={1}
              step={0.1}
              className="flex-1"
            />
          </div>
        </div>

        {/* Timer and Options */}
        <div className="flex justify-between items-center">
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAudioTimer(15)}
              className={`glass-button text-xs ${timer === 15 ? 'bg-warm-amber/20 text-warm-amber' : ''}`}
            >
              15m
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAudioTimer(30)}
              className={`glass-button text-xs ${timer === 30 ? 'bg-warm-amber/20 text-warm-amber' : ''}`}
            >
              30m
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAudioTimer(45)}
              className={`glass-button text-xs ${timer === 45 ? 'bg-warm-amber/20 text-warm-amber' : ''}`}
            >
              45m
            </Button>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleFavorite}
            className="glass-button"
          >
            <Heart className={`w-4 h-4 ${audio.isFavorite ? 'text-red-400 fill-current' : 'text-gray-400'}`} />
          </Button>
        </div>
      </Card>
    </div>
  );
}
