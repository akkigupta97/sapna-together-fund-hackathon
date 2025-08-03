import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX,
  Maximize,
  ArrowLeft,
  RotateCcw,
  Loader2,
  Sparkles,
  Video,
  RefreshCw
} from "lucide-react";

// Gradio video generation service
class VideoGenerationService {
  private gradioUrl: string;

  constructor(gradioUrl: string) {
    this.gradioUrl = gradioUrl;
  }

  async generateVideo(audioUrl: string, chronotype: string, persona: string): Promise<string> {
    try {
      // Color schemes based on chronotype and persona
      const colorSchemes = {
        Lion: { bg: "#FFF4E6", sphere: "#FF8C00" },
        Bear: { bg: "#F0FDF4", sphere: "#22C55E" },
        Wolf: { bg: "#F3E8FF", sphere: "#8B5CF6" },
        Dolphin: { bg: "#EFF6FF", sphere: "#3B82F6" }
      };

      const personaColors = {
        "Stress Melter": { bg: "#FDF2F8", sphere: "#EC4899" },
        "Mind Quieter": { bg: "#EFF6FF", sphere: "#3B82F6" },
        "Deep Sleeper": { bg: "#ECFDF5", sphere: "#059669" }
      };

      const colors = personaColors[persona as keyof typeof personaColors] || 
                    colorSchemes[chronotype as keyof typeof colorSchemes] || 
                    colorSchemes.Bear;

      // Step 1: Make initial call to get event ID
      const response = await fetch(`${this.gradioUrl}/gradio_api/call/generate_video`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: [
            {
              path: audioUrl,
              meta: { _type: "gradio.FileData" }
            },
            colors.bg,
            colors.sphere
          ]
        })
      });

      if (!response.ok) {
        throw new Error(`Video generation failed: ${response.statusText}`);
      }

      const result = await response.json();
      const eventId = result.event_id;

      if (!eventId) {
        throw new Error('No event ID received from Gradio API');
      }

      // Step 2: Poll for results using event ID
      const resultResponse = await fetch(`${this.gradioUrl}/gradio_api/call/generate_video/${eventId}`, {
        method: 'GET'
      });

      if (!resultResponse.ok) {
        throw new Error(`Failed to get video result: ${resultResponse.statusText}`);
      }

      // Handle streaming response
      const reader = resultResponse.body?.getReader();
      if (!reader) {
        throw new Error('No response body reader available');
      }

      let videoUrl = null;
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('event: complete')) {
            // Next line should contain the data
            continue;
          }
          
          if (line.startsWith('data: ')) {
            try {
              const dataStr = line.substring(6);
              
              // Skip heartbeat messages
              if (dataStr === 'null') {
                continue;
              }
              
              const data = JSON.parse(dataStr);
              console.log('Gradio response data:', data); // Debug log
              
              // The response is a direct array with the video URL
              if (Array.isArray(data) && data.length > 0) {
                videoUrl = data[0];
                break;
              }
              
            } catch (e) {
              console.error('Error parsing Gradio response:', e, 'Line:', line);
            }
          }
        }

        if (videoUrl) break;
      }

      if (!videoUrl) {
        throw new Error('No video URL found in Gradio response');
      }

      console.log('Extracted video URL:', videoUrl); // Debug log
      return videoUrl;
    } catch (error) {
      console.error('Video generation error:', error);
      throw error;
    }
  }
}

// Default video sources with better sleep-focused content
const getDefaultVideoSource = (chronotype: string, persona: string): { url: string; title: string; description: string } => {
  const videos = {
    "Stress Melter": {
      url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
      title: "Calming Stress Relief Visualization",
      description: "Gentle visuals designed to melt away tension and prepare your mind for deep rest"
    },
    "Mind Quieter": {
      url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4", 
      title: "Peaceful Mind Meditation",
      description: "Serene imagery to quiet racing thoughts and guide you into tranquil sleep"
    },
    "Deep Sleeper": {
      url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4",
      title: "Deep Sleep Journey",
      description: "Immersive visuals synchronized with your audio for profound sleep preparation"
    }
  };

  return videos[persona as keyof typeof videos] || videos["Deep Sleeper"];
};

export default function VideoExperience() {
  const [, setLocation] = useLocation();
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generationMessage, setGenerationMessage] = useState("");
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout>();

  // Get user data from localStorage
  const chronotype = JSON.parse(localStorage.getItem("chronotype") || "{}");
  const nightlyPersona = localStorage.getItem("tonightsPersona") || "Deep Sleeper";
  const currentAudioTrack = localStorage.getItem("currentAudioTrack");

  // Initialize video service
  const videoService = new VideoGenerationService("https://f464e053004b3a5d85.gradio.live");

  // Get current audio URL from localStorage or audio experience
  useEffect(() => {
    // Try to get current playing audio URL from previous component
    const storedAudioUrl = localStorage.getItem("currentPlayingAudio");
    if (storedAudioUrl) {
      setAudioUrl(storedAudioUrl);
    } else {
      // Fallback: use a default audio URL or the first available track
      const audioTracks = JSON.parse(localStorage.getItem("generatedAudioTracks") || "[]");
      if (audioTracks.length > 0 && audioTracks[0].audioUrl) {
        setAudioUrl(audioTracks[0].audioUrl);
      }
    }
  }, []);

  // Generate video when component mounts or audio changes
  useEffect(() => {
    if (audioUrl && !videoUrl && !isGenerating) {
      generatePersonalizedVideo();
    }
  }, [audioUrl]);

  const generatePersonalizedVideo = async () => {
    if (!audioUrl) {
      setError("No audio track available for video generation");
      loadDefaultVideo();
      return;
    }

    setIsGenerating(true);
    setError(null);
    setGenerationProgress(0);
    setGenerationMessage("Connecting to video generation service...");

    try {
      setGenerationProgress(10);
      setGenerationMessage("Analyzing your audio track...");
      
      // Add artificial delay to show progress
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setGenerationProgress(30);
      setGenerationMessage("Generating personalized visuals...");
      
      const generatedVideoUrl = await videoService.generateVideo(
        audioUrl, 
        chronotype.type || 'Bear', 
        nightlyPersona
      );

      setGenerationProgress(80);
      setGenerationMessage("Processing video file...");
      
      if (generatedVideoUrl) {
        setVideoUrl(generatedVideoUrl);
        setGenerationProgress(100);
        setGenerationMessage("Video ready!");
      } else {
        throw new Error("No video URL returned from generation service");
      }

    } catch (error: any) {
      console.error('Video generation failed:', error);
      setError(error.message || 'Failed to generate personalized video');
      setGenerationMessage("Using default visualization...");
      loadDefaultVideo();
    } finally {
      setIsGenerating(false);
      setTimeout(() => {
        setGenerationProgress(0);
        setGenerationMessage("");
      }, 3000);
    }
  };

  const loadDefaultVideo = () => {
    const defaultVideo = getDefaultVideoSource(chronotype.type || 'Bear', nightlyPersona);
    setVideoUrl(defaultVideo.url);
  };

  const videoData = videoUrl ? {
    url: videoUrl,
    title: `${nightlyPersona} Visual Therapy`,
    description: `Personalized video experience crafted for your ${chronotype.type || 'Bear'} chronotype`
  } : getDefaultVideoSource(chronotype.type || 'Bear', nightlyPersona);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const updateTime = () => setCurrentTime(video.currentTime);
    const updateDuration = () => setDuration(video.duration);
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => setIsPlaying(false);
    
    video.addEventListener('timeupdate', updateTime);
    video.addEventListener('loadedmetadata', updateDuration);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('ended', handleEnded);

    return () => {
      video.removeEventListener('timeupdate', updateTime);
      video.removeEventListener('loadedmetadata', updateDuration);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('ended', handleEnded);
    };
  }, [videoUrl]);

  // Auto-hide controls in fullscreen
  useEffect(() => {
    if (isFullscreen) {
      const resetTimeout = () => {
        if (controlsTimeoutRef.current) {
          clearTimeout(controlsTimeoutRef.current);
        }
        setShowControls(true);
        controlsTimeoutRef.current = setTimeout(() => {
          setShowControls(false);
        }, 3000);
      };

      const handleMouseMove = resetTimeout;
      const handleTouchStart = resetTimeout;

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('touchstart', handleTouchStart);
      resetTimeout();

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('touchstart', handleTouchStart);
        if (controlsTimeoutRef.current) {
          clearTimeout(controlsTimeoutRef.current);
        }
      };
    } else {
      setShowControls(true);
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    }
  }, [isFullscreen]);

  // Fullscreen change handler
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const handlePlayPause = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
    } else {
      video.play().catch(error => {
        console.error('Error playing video:', error);
        setError('Failed to play video. Please try again.');
      });
    }
  };

  const handleMute = () => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleFullscreen = async () => {
    const container = containerRef.current;
    if (!container) return;

    try {
      if (!isFullscreen) {
        if (container.requestFullscreen) {
          await container.requestFullscreen();
        }
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        }
      }
    } catch (error) {
      console.error('Fullscreen error:', error);
    }
  };

  const handleRestart = () => {
    const video = videoRef.current;
    if (!video) return;

    video.currentTime = 0;
    setCurrentTime(0);
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const video = videoRef.current;
    if (!video || !duration) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const newTime = (clickX / rect.width) * duration;
    
    video.currentTime = newTime;
    setCurrentTime(newTime);
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

  // Loading screen for video generation
  if (isGenerating) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4 md:p-6 flex items-center justify-center">
        <Card className="bg-white/10 backdrop-blur-md border-white/20 p-8 rounded-3xl shadow-2xl max-w-lg w-full text-center">
          <div className="mb-6">
            <Video className="w-16 h-16 mx-auto text-purple-300 mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">
              Creating Your Visual Experience
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
              🎵 Analyzing your audio track
            </div>
            <div className={generationProgress > 30 ? "text-purple-300" : ""}>
              🎨 Generating {nightlyPersona} visuals
            </div>
            <div className={generationProgress > 60 ? "text-purple-300" : ""}>
              ✨ Synchronizing with {chronotype.type || 'Bear'} chronotype
            </div>
            <div className={generationProgress > 90 ? "text-purple-300" : ""}>
              🎬 Finalizing your personalized video
            </div>
          </div>

          <Button 
            variant="outline" 
            className="mt-6 bg-white/5 border-white/20 hover:bg-white/10"
            onClick={() => setLocation("/audio-experience")}
          >
            <ArrowLeft className="mr-2 w-4 h-4" />
            Back to Audio
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className={`relative ${isFullscreen ? 'w-screen h-screen' : 'min-h-screen'} bg-black`}
    >
      {/* Video */}
      {videoUrl && (
        <video
          ref={videoRef}
          className="w-full h-full object-contain"
          src={videoData.url}
          preload="metadata"
          playsInline
          onClick={handlePlayPause}
          onError={(e) => {
            console.error('Video playback error:', e);
            setError('Failed to load video. Using default visualization.');
            loadDefaultVideo();
          }}
        />
      )}

      {/* Controls Overlay */}
      <div 
        className={`absolute inset-0 transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {/* Top Bar */}
        <div className="absolute top-0 left-0 right-0 p-4 md:p-6 bg-gradient-to-b from-black/80 to-transparent">
          <div className="flex items-center justify-between">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setLocation("/audio-experience")}
              className="text-white hover:bg-white/20 rounded-xl backdrop-blur-sm"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="text-center flex-1 mx-4">
              <div className="flex items-center justify-center mb-2">
                <h1 className="text-lg md:text-xl font-bold text-white mr-2">
                  {videoData.title}
                </h1>
                <Badge className="text-xs py-1 px-3 bg-purple-500/20 text-purple-300 border-purple-500/30 rounded-lg">
                  {nightlyPersona}
                </Badge>
              </div>
              <p className="text-sm text-gray-300 hidden md:block">
                {videoData.description}
              </p>
              {videoUrl && audioUrl && (
                <p className="text-xs text-purple-300 mt-1">
                  Generated from your personalized audio
                </p>
              )}
            </div>
            <div className="flex space-x-2">
              {!isFullscreen && (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={generatePersonalizedVideo}
                  disabled={isGenerating || !audioUrl}
                  className="text-white hover:bg-white/20 rounded-xl backdrop-blur-sm"
                  title="Regenerate video"
                >
                  <RefreshCw className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="absolute top-20 left-4 right-4 p-4 bg-red-500/20 border border-red-500/30 rounded-xl backdrop-blur-sm">
            <p className="text-red-200 text-sm text-center">{error}</p>
          </div>
        )}

        {/* Center Play Button (when paused) */}
        {!isPlaying && videoUrl && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Button
              onClick={handlePlayPause}
              className={`w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-gradient-to-r ${getPersonaColor()} hover:scale-110 transition-transform shadow-2xl backdrop-blur-sm`}
            >
              <Play className="w-8 h-8 md:w-10 md:h-10 ml-1" />
            </Button>
          </div>
        )}

        {/* Bottom Controls */}
        {videoUrl && (
          <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6 bg-gradient-to-t from-black/80 to-transparent">
            {/* Progress Bar */}
            <div className="mb-4">
              <div 
                className="w-full h-2 bg-gray-600/50 rounded-full cursor-pointer overflow-hidden backdrop-blur-sm"
                onClick={handleProgressClick}
              >
                <div 
                  className={`h-full bg-gradient-to-r ${getPersonaColor()} rounded-full transition-all duration-200 shadow-lg`}
                  style={{ width: duration ? `${(currentTime / duration) * 100}%` : '0%' }}
                />
              </div>
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>{formatTime(currentTime)}</span>
                <span className="text-purple-300">
                  {audioUrl ? "AI Generated" : "Default"}
                </span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            {/* Control Buttons */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3 md:space-x-4">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handlePlayPause}
                  className="text-white hover:bg-white/20 w-10 h-10 md:w-12 md:h-12 rounded-xl backdrop-blur-sm"
                >
                  {isPlaying ? (
                    <Pause className="w-5 h-5 md:w-6 md:h-6" />
                  ) : (
                    <Play className="w-5 h-5 md:w-6 md:h-6 ml-0.5" />
                  )}
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleRestart}
                  className="text-white hover:bg-white/20 w-10 h-10 rounded-xl backdrop-blur-sm"
                >
                  <RotateCcw className="w-4 h-4 md:w-5 md:h-5" />
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleMute}
                  className="text-white hover:bg-white/20 w-10 h-10 rounded-xl backdrop-blur-sm"
                >
                  {isMuted ? (
                    <VolumeX className="w-4 h-4 md:w-5 md:h-5" />
                  ) : (
                    <Volume2 className="w-4 h-4 md:w-5 md:h-5" />
                  )}
                </Button>
              </div>

              <div className="flex items-center space-x-2 md:space-x-3">
                {isFullscreen && (
                  <Button
                    variant="ghost"
                    onClick={() => setLocation("/audio-experience")}
                    className="text-white hover:bg-white/20 text-sm px-4 h-10 rounded-xl backdrop-blur-sm"
                  >
                    Sleep Soundscape
                  </Button>
                )}
                
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleFullscreen}
                  className="text-white hover:bg-white/20 w-10 h-10 rounded-xl backdrop-blur-sm"
                >
                  <Maximize className="w-4 h-4 md:w-5 md:h-5" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Loading State for Video */}
      {!videoUrl && !error && !isGenerating && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-white" />
            <p className="text-white">Loading your visual experience...</p>
          </div>
        </div>
      )}
    </div>
  );
}
