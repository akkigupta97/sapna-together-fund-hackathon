import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX,
  SkipBack,
  SkipForward,
  Bed,
  Headphones,
  Sparkles,
  Clock,
  Loader2
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// Import our updated Gradio-based audio service
import FrontendAudioService from "@/lib/audioGeneration";

interface AudioTrack {
  type: string;
  weight: number;
  duration?: number;
  audioUrl?: string;
}

interface PersonalizedAudioResponse {
  audioMix: {
    id: string;
    title: string;
    description: string;
    tracks: AudioTrack[];
  };
  tracks: AudioTrack[];
}

export default function AudioExperience() {
  const [, setLocation] = useLocation();
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [audioTracks, setAudioTracks] = useState<AudioTrack[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generationMessage, setGenerationMessage] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [audioLoading, setAudioLoading] = useState(false);
  const [audioReady, setAudioReady] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Get user data
  const chronotype = JSON.parse(localStorage.getItem("chronotype") || "{}");
  const nightlyPersona = localStorage.getItem("tonightsPersona") || "Deep Sleeper";
  const userId = localStorage.getItem("currentUserId") || "demo-user-123";

  // Initialize Gradio audio service
  const audioService = new FrontendAudioService("https://04498bebb8fed7557c.gradio.live");

  // Mutation for processing generated audio on backend
  const processAudioMutation = useMutation({
    mutationFn: async (audioData: {
      userId: string;
      chronotype: string;
      persona: string;
      soundPreferences: any;
      tracks: AudioTrack[];
      generatedAudios: any[];
    }) => {
      return await apiRequest("POST", "/api/audios/personalized", audioData);
    },
    onSuccess: async (response) => {
      try {
        const data: PersonalizedAudioResponse = await response.json();
        
        toast({
          title: "Audio saved successfully",
          description: "Your personalized sleep soundscape has been saved",
        });

        // Invalidate related queries
        queryClient.invalidateQueries({ queryKey: ["/api/audios", userId] });
        
      } catch (parseError: any) {
        console.error('Failed to parse backend response:', parseError);
      }
    },
    onError: (error: any) => {
      console.error('Error saving audio to backend:', error);
      toast({
        title: "Failed to save audio",
        description: "Audio generated but couldn't be saved to your library",
        variant: "destructive",
      });
    }
  });

  // Function to generate personalized audio using Gradio service
  const generatePersonalizedAudio = async () => {
    setIsGenerating(true);
    setError(null);
    setGenerationProgress(0);
    setGenerationMessage("Initializing Gradio audio generation...");

    try {
      // Test connection first
      setGenerationMessage("Connecting to Gradio service...");
      setGenerationProgress(5);

      const healthCheck = await audioService.checkServiceHealth();
      if (!healthCheck.isHealthy) {
        throw new Error(`Gradio service unavailable: ${healthCheck.message}`);
      }

      setGenerationMessage("Connection established, generating audio...");
      setGenerationProgress(10);

      const soundPreferences = {
        gentleMusic: 'like',
        natureSounds: 'like',
        whisperingVoice: 'neutral',
        whiteNoise: 'neutral'
      };

      // Generate audio tracks using Gradio
      const { tracks, generatedAudios } = await audioService.generatePersonalizedAudio(
        userId,
        chronotype.type || 'Bear',
        nightlyPersona,
        {
          gentleMusic: 'like',
          natureSounds: 'like',
          whisperingVoice: 'neutral',
          whiteNoise: 'neutral'
        },
        (progress, message) => {
          setGenerationProgress(progress);
          setGenerationMessage(message);
        }
      );

      setGenerationMessage("Processing audio files...");
      setGenerationProgress(95);

      // Update tracks with generated audio URLs
      const updatedTracks = tracks.map((track, index) => {
        const generatedAudio = generatedAudios.find(audio => audio.trackIndex === index);
        return {
          ...track,
          audioUrl: generatedAudio?.audioUrl || undefined
        };
      });

      // Set tracks for immediate playback
      setAudioTracks(updatedTracks);
      
  // Load first track with audio
      const firstTrackWithAudio = updatedTracks.find(track => track.audioUrl);
      
      if (firstTrackWithAudio && audioRef.current) {
        await loadAudioTrack(firstTrackWithAudio.audioUrl!, updatedTracks.indexOf(firstTrackWithAudio));
        // Store current audio URL for video generation
        localStorage.setItem("currentPlayingAudio", firstTrackWithAudio.audioUrl!);
        localStorage.setItem("generatedAudioTracks", JSON.stringify(updatedTracks));
      }

      // Send to backend for processing and storage (modified for Gradio URLs)
      processAudioMutation.mutate({
        userId,
        chronotype: chronotype.type || 'Bear',
        persona: nightlyPersona,
        soundPreferences,
        tracks: updatedTracks,
        generatedAudios: generatedAudios.map(audio => ({
          ...audio,
          // Convert URL to reference since backend expects different format
          audioUrl: audio.audioUrl,
          fileName: audio.fileName
        }))
      });

      setGenerationProgress(100);
      setGenerationMessage("Audio generation complete!");
      
      toast({
        title: "Audio generated successfully",
        description: "Your personalized sleep soundscape is ready",
      });

    } catch (error: any) {
      console.error('Gradio audio generation failed:', error);
      setError(error.message || 'Failed to generate audio');
      
      // Fallback to default recipe
      setAudioTracks(getDefaultAudioRecipe(chronotype.type, nightlyPersona));
      
      toast({
        title: "Audio generation failed",
        description: `${error.message || 'Unknown error'}. Using default soundscape.`,
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
      setTimeout(() => {
        setGenerationProgress(0);
        setGenerationMessage("");
      }, 3000);
    }
  };

  // Function to load audio track with proper error handling
  const loadAudioTrack = async (audioUrl: string, trackIndex: number) => {
    if (!audioRef.current) return;

    setAudioLoading(true);
    setAudioReady(false);
    setError(null);

    try {
      const audio = audioRef.current;
      
      // Reset audio element
      audio.pause();
      audio.currentTime = 0;
      setCurrentTime(0);
      setDuration(0);
      setIsPlaying(false);

      // Set crossOrigin before setting src
      audio.crossOrigin = "anonymous";
      audio.preload = "metadata";
      
      // Set the source
      audio.src = audioUrl;
      setCurrentTrackIndex(trackIndex);

      // Wait for the audio to be ready
      await new Promise((resolve, reject) => {
        const handleCanPlay = () => {
          audio.removeEventListener('canplay', handleCanPlay);
          audio.removeEventListener('error', handleError);
          setAudioReady(true);
          setAudioLoading(false);
          resolve(true);
        };

        const handleError = (e: any) => {
          audio.removeEventListener('canplay', handleCanPlay);
          audio.removeEventListener('error', handleError);
          console.error('Audio loading error:', e);
          reject(new Error('Failed to load audio track'));
        };

        audio.addEventListener('canplay', handleCanPlay);
        audio.addEventListener('error', handleError);
        
        // Load the audio
        audio.load();
      });

    } catch (error: any) {
      console.error('Error loading audio track:', error);
      setError(`Failed to load audio: ${error.message}`);
      setAudioLoading(false);
      setAudioReady(false);
      
      toast({
        title: "Audio loading failed",
        description: "Failed to load the audio track. Please try another track.",
        variant: "destructive",
      });
    }
  };

  // Generate personalized audio on component mount
  useEffect(() => {
    if (!isGenerating && audioTracks.length === 0) {
      generatePersonalizedAudio();
    }
  }, []);

  // Fallback function for when API fails
  const getDefaultAudioRecipe = (chronotype: string, persona: string): AudioTrack[] => {
    const baseRecipes: Record<string, AudioTrack[]> = {
      "Stress Melter": [
        { type: "Guided Meditation", weight: 0.5, duration: 600 },
        { type: "Gentle Piano", weight: 0.3, duration: 1800 },
        { type: "Rain on a Tent", weight: 0.2, duration: 3600 }
      ],
      "Mind Quieter": [
        { type: "Sleep Story", weight: 0.6, duration: 900 },
        { type: "Forest Sounds", weight: 0.4, duration: 3600 }
      ],
      "Deep Sleeper": [
        { type: "Pink Noise", weight: 0.5, duration: 7200 },
        { type: "Binaural Beats", weight: 0.3, duration: 3600 },
        { type: "Whale Songs", weight: 0.2, duration: 1800 }
      ]
    };

    return baseRecipes[persona as keyof typeof baseRecipes] || baseRecipes["Deep Sleeper"];
  };

  // Enhanced audio event listeners
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => {
      if (audio.currentTime !== currentTime) {
        setCurrentTime(audio.currentTime);
      }
    };
    
    const updateDuration = () => {
      if (audio.duration && audio.duration !== duration) {
        setDuration(audio.duration);
      }
    };
    
    const handlePlay = () => {
      console.log('Audio started playing');
      setIsPlaying(true);
    };

    const handlePause = () => {
      console.log('Audio paused');
      setIsPlaying(false);
    };

    const handleEnded = () => {
      console.log('Audio ended');
      setIsPlaying(false);
      // Auto-advance to next track
      if (currentTrackIndex < audioTracks.length - 1) {
        playNextTrack();
      }
    };

    const handleError = (e: any) => {
      console.error('Audio playback error:', e);
      setError('Audio playback failed. The file may be corrupted or unavailable.');
      setIsPlaying(false);
    };

    const handleLoadedMetadata = () => {
      console.log('Audio metadata loaded');
      updateDuration();
    };
    
    // Add all event listeners
    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
    };
  }, [currentTrackIndex, audioTracks, currentTime, duration]);

  const handlePlayPause = async () => {
    const audio = audioRef.current;
    if (!audio || audioTracks.length === 0) return;

    const currentTrack = audioTracks[currentTrackIndex];
    if (!currentTrack?.audioUrl) {
      setError('No audio URL available for current track');
      return;
    }

    try {
      if (isPlaying) {
        audio.pause();
      } else {
        // Ensure audio is loaded and ready
        if (!audioReady || audio.src !== currentTrack.audioUrl) {
          await loadAudioTrack(currentTrack.audioUrl, currentTrackIndex);
        }
        
        // Try to play
        const playPromise = audio.play();
        if (playPromise !== undefined) {
          await playPromise;
        }
      }
    } catch (error: any) {
      console.error('Error during play/pause:', error);
      setError(`Playback failed: ${error.message}`);
      setIsPlaying(false);
      
      toast({
        title: "Playback error",
        description: "Failed to play audio. The file may not be accessible.",
        variant: "destructive",
      });
    }
  };

  const handleMute = () => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const playNextTrack = async () => {
    if (currentTrackIndex < audioTracks.length - 1) {
      const nextIndex = currentTrackIndex + 1;
      const nextTrack = audioTracks[nextIndex];
      
      if (nextTrack.audioUrl) {
        await loadAudioTrack(nextTrack.audioUrl, nextIndex);
        // Store current audio URL for video generation
        localStorage.setItem("currentPlayingAudio", nextTrack.audioUrl);
        if (isPlaying && audioRef.current) {
          try {
            await audioRef.current.play();
          } catch (error) {
            console.error('Error playing next track:', error);
          }
        }
      }
    }
  };

  const playPreviousTrack = async () => {
    if (currentTrackIndex > 0) {
      const prevIndex = currentTrackIndex - 1;
      const prevTrack = audioTracks[prevIndex];
      
      if (prevTrack.audioUrl) {
        await loadAudioTrack(prevTrack.audioUrl, prevIndex);
        // Store current audio URL for video generation
        localStorage.setItem("currentPlayingAudio", prevTrack.audioUrl);
        if (isPlaying && audioRef.current) {
          try {
            await audioRef.current.play();
          } catch (error) {
            console.error('Error playing previous track:', error);
          }
        }
      }
    }
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    if (!audio || !duration) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const newTime = (clickX / rect.width) * duration;
    
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleTrackSelect = async (trackIndex: number) => {
    const track = audioTracks[trackIndex];
    if (track.audioUrl) {
      await loadAudioTrack(track.audioUrl, trackIndex);
      // Store current audio URL for video generation
      localStorage.setItem("currentPlayingAudio", track.audioUrl);
      if (isPlaying) {
        try {
          await audioRef.current?.play();
        } catch (error) {
          console.error('Error playing selected track:', error);
        }
      }
    }
  };

  const formatTime = (seconds: number) => {
    if (!seconds || !isFinite(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getPersonaColor = () => {
    switch (nightlyPersona) {
      case "Stress Melter": return "from-pink-500 to-rose-500";
      case "Mind Quieter": return "from-blue-500 to-indigo-500";
      case "Deep Sleeper": return "from-teal-500 to-emerald-500";
      default: return "from-purple-500 to-indigo-500";
    }
  };

  // Enhanced audio recipe with icons
  const enhancedAudioTracks = audioTracks.map(track => ({
    ...track,
    icon: {
      "Pink Noise": "📻",
      "Forest Sounds": "🌲",
      "Whale Songs": "🐋",
      "Gentle Piano": "🎹",
      "Guided Meditation": "🧘",
      "Sleep Story": "📖",
      "ASMR Triggers": "👂",
      "Deep Breathing Pacer": "💨",
      "Binaural Beats": "🧠",
      "Rain on a Tent": "⛺",
      "Morning Birds": "🐦",
      "Crickets": "🦗",
      "Distant Thunder": "⛈️",
      "Underwater": "🌊"
    }[track.type] || "🎵"
  }));

  const currentTrack = audioTracks[currentTrackIndex];

  if (isGenerating) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4 md:p-6 flex items-center justify-center">
        <Card className="bg-white/10 backdrop-blur-md border-white/20 p-8 rounded-3xl shadow-2xl max-w-lg w-full text-center">
          <div className="mb-6">
            <Loader2 className="w-16 h-16 animate-spin mx-auto text-purple-300 mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">
              Creating Your Sleep Experience
            </h2>
            <p className="text-gray-300 mb-4">
              {generationMessage}
            </p>
            
            <div className="w-full bg-gray-700/50 rounded-full h-3 mb-6">
              <div 
                className={`h-full bg-gradient-to-r ${getPersonaColor()} rounded-full transition-all duration-500`}
                style={{ width: `${generationProgress}%` }}
              />
            </div>
          </div>
          
          <div className="space-y-2 text-sm text-gray-400">
            <div className={generationProgress > 10 ? "text-purple-300" : ""}>
              ✨ Analyzing your {chronotype.type || 'Bear'} chronotype
            </div>
            <div className={generationProgress > 30 ? "text-purple-300" : ""}>
              🎭 Crafting {nightlyPersona} persona sounds
            </div>
            <div className={generationProgress > 50 ? "text-purple-300" : ""}>
              🎵 Generating AI-powered audio with Gradio
            </div>
            <div className={generationProgress > 90 ? "text-purple-300" : ""}>
              💾 Processing and saving audio files
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4 md:p-6 flex items-center justify-center">
      <div className="max-w-lg w-full">
        <Card className="bg-white/10 backdrop-blur-md border-white/20 p-8 rounded-3xl shadow-2xl">
          <div className="text-center mb-10">
            <div className={`w-24 h-24 rounded-3xl bg-gradient-to-r ${getPersonaColor()} flex items-center justify-center mx-auto mb-6 shadow-lg`}>
              <Headphones className="w-12 h-12 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-3">Personalized Sleep Soundscape</h1>
            <Badge className="text-lg py-2 px-6 bg-white/10 text-white border-white/20 rounded-xl">
              {nightlyPersona}
            </Badge>
            {chronotype.type && (
              <p className="text-gray-300 mt-3">Crafted for {chronotype.type} Sleep Type</p>
            )}
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-xl">
              <p className="text-red-200 text-sm">{error}</p>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-2 bg-red-500/20 border-red-500/30 hover:bg-red-500/30"
                onClick={generatePersonalizedAudio}
                disabled={isGenerating}
              >
                {isGenerating ? "Retrying..." : "Retry Generation"}
              </Button>
            </div>
          )}

          {audioLoading && (
            <div className="mb-6 p-4 bg-blue-500/20 border border-blue-500/30 rounded-xl">
              <div className="flex items-center">
                <Loader2 className="w-4 h-4 animate-spin mr-2 text-blue-300" />
                <p className="text-blue-200 text-sm">Loading audio track...</p>
              </div>
            </div>
          )}
          
          {/* Sound Layers */}
          <div className="mb-8">
            <h2 className="text-lg font-medium text-white mb-6 flex items-center">
              <Sparkles className="w-5 h-5 mr-2 text-purple-300" />
              Tonight's Sound Layers
            </h2>
            <div className="space-y-4">
              {enhancedAudioTracks.map((track, index) => (
                <div key={index} className={`flex items-center justify-between p-4 rounded-xl border transition-colors ${
                  index === currentTrackIndex 
                    ? 'bg-white/15 border-purple-400/50' 
                    : 'bg-white/5 border-white/10 hover:bg-white/10'
                }`}>
                  <div className="flex items-center">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center mr-4 ${
                      index === currentTrackIndex ? 'bg-purple-500/30' : 'bg-white/10'
                    }`}>
                      <span className="text-lg">{track.icon}</span>
                    </div>
                    <div>
                      <span className="text-white font-medium">{track.type}</span>
                      <div className="text-sm text-gray-400">
                        {(track.weight * 100).toFixed(0)}% intensity
                        {track.duration && ` • ${Math.floor(track.duration / 60)}min`}
                        {track.audioUrl && " • Ready"}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {track.audioUrl ? (
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="w-10 h-10 hover:bg-white/20 rounded-lg"
                        onClick={() => handleTrackSelect(index)}
                        disabled={audioLoading}
                      >
                        {audioLoading && index === currentTrackIndex ? (
                          <Loader2 className="w-4 h-4 animate-spin text-purple-300" />
                        ) : index === currentTrackIndex && isPlaying ? (
                          <Pause className="w-4 h-4 text-purple-300" />
                        ) : (
                          <Play className="w-4 h-4 text-purple-300" />
                        )}
                      </Button>
                    ) : (
                      <div className="w-10 h-10 flex items-center justify-center">
                        <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse"></div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Current Track Info */}
          {currentTrack && (
            <div className="mb-6 text-center">
              <p className="text-gray-300 text-sm">Now Playing</p>
              <h3 className="text-white font-medium">{currentTrack.type}</h3>
              <p className="text-purple-300 text-xs mt-1">
                {audioReady ? "Ready to play" : "Loading..."} • Generated by Gradio AI
              </p>
            </div>
          )}
          
          {/* Enhanced Progress Bar */}
          <div className="mb-8">
            <div 
              className="w-full h-3 bg-gray-700/50 rounded-full cursor-pointer overflow-hidden"
              onClick={handleProgressClick}
            >
              <div 
                className={`h-full bg-gradient-to-r ${getPersonaColor()} rounded-full transition-all duration-300 shadow-lg`}
                style={{ width: duration ? `${(currentTime / duration) * 100}%` : '0%' }}
              />
            </div>
            <div className="flex justify-between text-sm text-gray-400 mt-3">
              <span>{formatTime(currentTime)}</span>
              <span className="text-purple-300">Gradio AI-Generated</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>
          
          {/* Enhanced Player Controls */}
          <div className="flex items-center justify-center space-x-6 mb-8">
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-gray-300 hover:text-white hover:bg-white/20 w-12 h-12 rounded-xl"
              onClick={playPreviousTrack}
              disabled={currentTrackIndex === 0 || audioLoading}
            >
              <SkipBack className="w-6 h-6" />
            </Button>
            
            <Button
              size="icon"
              className={`w-16 h-16 rounded-2xl shadow-lg transition-all duration-300 ${
                isPlaying 
                  ? "bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600" 
                  : `bg-gradient-to-r ${getPersonaColor()} hover:scale-110`
              }`}
              onClick={handlePlayPause}
              disabled={audioTracks.length === 0 || !currentTrack?.audioUrl || audioLoading}
            >
              {audioLoading ? (
                <Loader2 className="w-8 h-8 text-white animate-spin" />
              ) : isPlaying ? (
                <Pause className="w-8 h-8 text-white" />
              ) : (
                <Play className="w-8 h-8 text-white ml-1" />
              )}
            </Button>
            
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-gray-300 hover:text-white hover:bg-white/20 w-12 h-12 rounded-xl"
              onClick={playNextTrack}
              disabled={currentTrackIndex === audioTracks.length - 1 || audioLoading}
            >
              <SkipForward className="w-6 h-6" />
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              className="text-gray-300 hover:text-white hover:bg-white/20 w-12 h-12 rounded-xl"
              onClick={handleMute}
              disabled={!audioRef.current}
            >
              {isMuted ? (
                <VolumeX className="w-6 h-6" />
              ) : (
                <Volume2 className="w-6 h-6" />
              )}
            </Button>
          </div>
          
          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <Button 
              variant="outline" 
              className="bg-white/5 border-white/20 hover:bg-white/10 h-12 rounded-xl"
              onClick={generatePersonalizedAudio}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                  Generating...
                </>
              ) : (
                'Regenerate Audio'
              )}
            </Button>
            <Button 
              className="bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 h-12 rounded-xl"
              onClick={() => setLocation("/video-experience")}
            >
              Visual Therapy
            </Button>
          </div>
          
          <Button 
            className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 h-14 rounded-xl font-medium text-lg shadow-lg"
            onClick={() => setLocation("/sleep-track")}
          >
            <Bed className="mr-3 w-5 h-5" />
            Begin Sleep Tracking
          </Button>
        </Card>
        
        {/* Enhanced audio element with CORS support */}
        <audio
          ref={audioRef}
          preload="metadata"
          crossOrigin="anonymous"
          onLoadStart={() => console.log('Audio loading started')}
          onCanPlay={() => console.log('Audio can play')}
          onLoadedData={() => console.log('Audio data loaded')}
          onLoadedMetadata={() => console.log('Audio metadata loaded')}
          onError={(e) => {
            console.error('Audio element error:', e);
            const target = e.target as HTMLAudioElement;
            if (target.error) {
              console.error('Audio error details:', {
                code: target.error.code,
                message: target.error.message
              });
            }
            setError('Failed to load audio track');
            setIsPlaying(false);
            setAudioLoading(false);
          }}
        />
      </div>
    </div>
  );
}
