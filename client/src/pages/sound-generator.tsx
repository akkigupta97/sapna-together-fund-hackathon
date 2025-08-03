import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useLocation } from 'wouter';
import * as THREE from 'three';
import { X, Play, Pause, Volume2, VolumeX, Loader2 } from 'lucide-react';
import FrontendAudioService from "@/lib/audioGeneration";

interface SphereAttribute {
  name: string;
  pos: THREE.Vector3;
  id: string;
  isAddButton?: boolean;
}

interface AudioTrack {
  type: string;
  weight: number;
  duration?: number;
  audioUrl?: string;
}

const SoundGeneratorPage: React.FC = () => {
  const [, setLocation] = useLocation();
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const sphereGroupRef = useRef<THREE.Group | null>(null);
  const pointsRef = useRef<THREE.Points | null>(null);
  const clockRef = useRef<THREE.Clock>(new THREE.Clock());
  const originalPositionsRef = useRef<Float32Array | null>(null);
  const animationIdRef = useRef<number | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  
  const [selectedAttributes, setSelectedAttributes] = useState<Set<string>>(new Set());
  const [sphereAttributes, setSphereAttributes] = useState<SphereAttribute[]>([
    { name: 'FOREST', pos: new THREE.Vector3(0, 1.95, 0), id: 'forest' },
    { name: 'WATER', pos: new THREE.Vector3(-1.7, -0.8, 0.5), id: 'water' },
    { name: 'RAIN', pos: new THREE.Vector3(1.7, -0.8, -0.5), id: 'rain' },
    { name: '+', pos: new THREE.Vector3(0, 0, 1.8), id: 'add', isAddButton: true }
  ]);
  const [output, setOutput] = useState<string>("Click 'Generate' to create a soundscape prompt.");
  const [showModal, setShowModal] = useState<boolean>(false);
  const [newAttributeName, setNewAttributeName] = useState<string>('');
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const previousMousePosition = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  
  // Audio-related state
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generationProgress, setGenerationProgress] = useState<number>(0);
  const [generationMessage, setGenerationMessage] = useState<string>('');
  const [audioTracks, setAudioTracks] = useState<AudioTrack[]>([]);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [currentTrackIndex, setCurrentTrackIndex] = useState<number>(0);
  const [audioReady, setAudioReady] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Get user data (similar to audio-experience.tsx)
  const chronotype = JSON.parse(localStorage.getItem("chronotype") || '{"type": "Bear"}');
  const nightlyPersona = localStorage.getItem("tonightsPersona") || "Deep Sleeper";
  const userId = localStorage.getItem("currentUserId") || "demo-user-123";

  // Simple audio generation using selected attributes
  const generateAudioFromPrompt = async (prompt: string, progressCallback: (progress: number, message: string) => void) => {
    try {
      progressCallback(20, "Analyzing selected sounds...");
      await new Promise(resolve => setTimeout(resolve, 500));
      
      progressCallback(50, "Generating audio with Gradio...");
      
      // Call Gradio API directly with the prompt
      const response = await fetch("https://04498bebb8fed7557c.gradio.live/api/predict", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: [prompt],
          fn_index: 0,
        }),
      });

      if (!response.ok) {
        throw new Error(`Gradio API error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      progressCallback(80, "Processing generated audio...");
      
      let audioUrl = null;
      if (result.data && Array.isArray(result.data) && result.data[0]) {
        const audioPath = result.data[0];
        if (typeof audioPath === 'string') {
          audioUrl = audioPath.startsWith('http') 
            ? audioPath 
            : `https://04498bebb8fed7557c.gradio.live/file=${audioPath}`;
        }
      }

      progressCallback(100, "Audio generation complete!");
      
      return {
        tracks: [{ type: "Generated Soundscape", weight: 1.0, duration: 300, audioUrl }],
        generatedAudios: audioUrl ? [{ trackIndex: 0, audioUrl, fileName: "generated-soundscape.wav" }] : []
      };
      
    } catch (error) {
      console.error('Audio generation failed:', error);
      throw error;
    }
  };

  // Perlin noise implementation (keeping original)
  const p = new Uint8Array(512);
  const permutation = [151,160,137,91,90,15,131,13,201,95,96,53,194,233,7,225,140,36,103,30,69,142,8,99,37,240,21,10,23,190,6,148,247,120,234,75,0,26,197,62,94,252,219,203,117,35,11,32,57,177,33,88,237,149,56,87,174,20,125,136,171,168,68,175,74,165,71,134,139,48,27,166,77,146,158,231,83,111,229,122,60,211,133,230,220,105,92,41,55,46,245,40,244,102,143,54,65,25,63,161,1,216,80,73,209,76,132,187,208,89,18,169,200,196,135,130,116,188,159,86,164,100,109,198,173,186,3,64,52,217,226,250,124,123,5,202,38,147,118,126,255,82,85,212,207,206,59,227,47,16,58,17,182,189,28,42,223,183,170,213,119,248,152,2,44,154,163,70,221,153,101,155,167,43,172,9,129,22,39,253,19,98,108,110,79,113,224,232,178,185,112,104,218,246,97,228,251,34,242,193,238,210,144,12,191,179,162,241,81,51,145,235,249,14,239,107,49,192,214,31,181,199,106,157,184,84,204,176,115,121,50,45,127,4,150,254,138,236,205,93,222,114,67,29,24,72,243,141,128,195,78,66,215,61,156,180];
  
  for(let i = 0; i < 256; i++) p[i] = p[i+256] = permutation[i];
  
  const fade = (t: number): number => t*t*t*(t*(t*6-15)+10);
  const lerp = (t: number, a: number, b: number): number => a+t*(b-a);
  const grad = (h: number, x: number, y: number, z: number): number => {
    const u = h < 8 ? x : y;
    const v = h < 4 ? y : h == 12 || h == 14 ? x : z;
    return ((h&1) == 0 ? u : -u) + ((h&2) == 0 ? v : -v);
  };
  
  const noise = (x: number, y: number, z: number): number => {
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;
    const Z = Math.floor(z) & 255;
    x -= Math.floor(x);
    y -= Math.floor(y);
    z -= Math.floor(z);
    const u = fade(x);
    const v = fade(y);
    const w = fade(z);
    const A = p[X] + Y;
    const AA = p[A] + Z;
    const AB = p[A+1] + Z;
    const B = p[X+1] + Y;
    const BA = p[B] + Z;
    const BB = p[B+1] + Z;
    return lerp(w,
      lerp(v,
        lerp(u, grad(p[AA], x, y, z), grad(p[BA], x-1, y, z)),
        lerp(u, grad(p[AB], x, y-1, z), grad(p[BB], x-1, y-1, z))
      ),
      lerp(v,
        lerp(u, grad(p[AA+1], x, y, z-1), grad(p[BA+1], x-1, y, z-1)),
        lerp(u, grad(p[AB+1], x, y-1, z-1), grad(p[BB+1], x-1, y-1, z-1))
      )
    );
  };

  // Initialize Three.js scene (keeping original)
  useEffect(() => {
    if (!canvasRef.current) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setClearColor(0x000000, 0);
    
    canvasRef.current.appendChild(renderer.domElement);
    camera.position.z = 5;

    const sphereGroup = new THREE.Group();
    scene.add(sphereGroup);

    const sphereGeometry = new THREE.SphereGeometry(1.8, 128, 128);
    
    const colors = [];
    const color = new THREE.Color();
    for (let i = 0; i < sphereGeometry.attributes.position.count; i++) {
      color.setHSL(Math.random(), 1.0, 0.5);
      colors.push(color.r, color.g, color.b);
    }
    sphereGeometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 0.025,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      opacity: 0.9,
      vertexColors: true
    });
    
    const points = new THREE.Points(sphereGeometry, material);
    sphereGroup.add(points);
    
    const originalPositions = new Float32Array(sphereGeometry.attributes.position.array);

    sceneRef.current = scene;
    rendererRef.current = renderer;
    cameraRef.current = camera;
    sphereGroupRef.current = sphereGroup;
    pointsRef.current = points;
    originalPositionsRef.current = originalPositions;

    return () => {
      if (canvasRef.current && renderer.domElement) {
        canvasRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  // Animation loop (keeping original)
  const animate = useCallback(() => {
    if (!pointsRef.current || !originalPositionsRef.current) return;

    const time = clockRef.current.getElapsedTime();
    const positions = pointsRef.current.geometry.attributes.position.array;
    const colors = pointsRef.current.geometry.attributes.color.array;
    const tempColor = new THREE.Color();
    
    for (let i = 0; i < positions.length; i += 3) {
      const ox = originalPositionsRef.current[i];
      const oy = originalPositionsRef.current[i + 1];
      const oz = originalPositionsRef.current[i + 2];
      
      const longWave = noise(ox * 0.5 + time * 0.2, oy * 0.5 + time * 0.2, oz * 0.5) * 0.4;
      const shortWave = noise(ox * 2.0 + time * 0.8, oy * 2.0 + time * 0.8, oz * 2.0) * 0.15;
      const displacement = longWave + shortWave;

      const vec = new THREE.Vector3(ox, oy, oz).normalize().multiplyScalar(displacement);
      positions[i] = ox + vec.x;
      positions[i + 1] = oy + vec.y;
      positions[i + 2] = oz + vec.z;

      const hue = (noise(ox * 0.3, oy * 0.3, time * 0.1) + 1) / 2;
      tempColor.setHSL(hue, 0.8, 0.6);

      colors[i] = tempColor.r;
      colors[i+1] = tempColor.g;
      colors[i+2] = tempColor.b;
    }
    
    pointsRef.current.geometry.attributes.position.needsUpdate = true;
    pointsRef.current.geometry.attributes.color.needsUpdate = true;

    if (!isDragging && sphereGroupRef.current) {
      sphereGroupRef.current.rotation.y += 0.0005;
      sphereGroupRef.current.rotation.x += 0.0002;
    }

    if (rendererRef.current && sceneRef.current && cameraRef.current) {
      rendererRef.current.render(sceneRef.current, cameraRef.current);
    }

    animationIdRef.current = requestAnimationFrame(animate);
  }, [isDragging, noise]);

  useEffect(() => {
    animate();
    return () => {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
    };
  }, [animate]);

  // Audio event listeners
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => {
      if (audio.duration && audio.duration !== duration) {
        setDuration(audio.duration);
      }
    };
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => setIsPlaying(false);
    const handleError = () => {
      setError('Audio playback failed');
      setIsPlaying(false);
    };

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
    };
  }, [duration]);

  // Load audio track
  const loadAudioTrack = async (audioUrl: string, trackIndex: number) => {
    if (!audioRef.current) return;

    try {
      const audio = audioRef.current;
      audio.pause();
      audio.currentTime = 0;
      setCurrentTime(0);
      setDuration(0);
      setIsPlaying(false);

      audio.crossOrigin = "anonymous";
      audio.preload = "metadata";
      audio.src = audioUrl;
      setCurrentTrackIndex(trackIndex);

      await new Promise((resolve, reject) => {
        const handleCanPlay = () => {
          audio.removeEventListener('canplay', handleCanPlay);
          audio.removeEventListener('error', handleError);
          setAudioReady(true);
          resolve(true);
        };

        const handleError = (e: any) => {
          audio.removeEventListener('canplay', handleCanPlay);
          audio.removeEventListener('error', handleError);
          reject(new Error('Failed to load audio track'));
        };

        audio.addEventListener('canplay', handleCanPlay);
        audio.addEventListener('error', handleError);
        audio.load();
      });

      // Auto-play the first track
      await audio.play();
    } catch (error: any) {
      console.error('Error loading audio track:', error);
      setError(`Failed to load audio: ${error.message}`);
      setAudioReady(false);
    }
  };

  // Generate audio based on selected attributes
  const generatePersonalizedAudio = async () => {
    if (selectedAttributes.size === 0) {
      setOutput("Please select at least one attribute.");
      return;
    }

    setIsGenerating(true);
    setError(null);
    setGenerationProgress(0);
    setGenerationMessage("Initializing audio generation...");

    try {
      const selectedNames = sphereAttributes
        .filter(attr => selectedAttributes.has(attr.id) && !attr.isAddButton)
        .map(attr => attr.name);

      // Create the prompt for Gradio
      const prompt = `Generate a sleeping soundscape featuring: ${selectedNames.join(', ')}.`;
      setOutput(`Generating: ${prompt}`);

      const { tracks, generatedAudios } = await generateAudioFromPrompt(
        prompt,
        (progress, message) => {
          setGenerationProgress(progress);
          setGenerationMessage(message);
        }
      );

      // Update tracks with generated audio URLs
      const updatedTracks = tracks.map((track, index) => {
        const generatedAudio = generatedAudios.find(audio => audio.trackIndex === index);
        return {
          ...track,
          audioUrl: generatedAudio?.audioUrl || undefined
        };
      });

      setAudioTracks(updatedTracks);
      
      // Load first track with audio and start playing
      const firstTrackWithAudio = updatedTracks.find(track => track.audioUrl);
      if (firstTrackWithAudio && audioRef.current) {
        await loadAudioTrack(firstTrackWithAudio.audioUrl!, updatedTracks.indexOf(firstTrackWithAudio));
      }

      setOutput(`Now playing: ${selectedNames.join(', ')} soundscape`);
      
    } catch (error: any) {
      console.error('Audio generation failed:', error);
      setError(error.message || 'Failed to generate audio');
      setOutput(`Generation failed: ${error.message}`);
    } finally {
      setIsGenerating(false);
      setTimeout(() => {
        setGenerationProgress(0);
        setGenerationMessage("");
      }, 3000);
    }
  };

  // Mouse controls (keeping original)
  const handlePointerDown = useCallback((event: React.PointerEvent) => {
    if ((event.target as HTMLElement).closest('button')) {
      return;
    }
    
    event.preventDefault();
    setIsDragging(true);
    
    const clientX = event.clientX;
    const clientY = event.clientY;
    previousMousePosition.current = { x: clientX, y: clientY };
  }, []);

  const handlePointerMove = useCallback((event: React.PointerEvent) => {
    if (!isDragging || !sphereGroupRef.current) return;
    
    event.preventDefault();
    
    const currentX = event.clientX;
    const currentY = event.clientY;
    const deltaX = currentX - previousMousePosition.current.x;
    const deltaY = currentY - previousMousePosition.current.y;

    sphereGroupRef.current.rotation.y += deltaX * 0.005;
    sphereGroupRef.current.rotation.x += deltaY * 0.005;

    previousMousePosition.current = { x: currentX, y: currentY };
  }, [isDragging]);

  const handlePointerUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Resize handler (keeping original)
  useEffect(() => {
    const handleResize = () => {
      if (cameraRef.current && rendererRef.current) {
        cameraRef.current.aspect = window.innerWidth / window.innerHeight;
        cameraRef.current.updateProjectionMatrix();
        rendererRef.current.setSize(window.innerWidth, window.innerHeight);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleAttribute = (attrId: string) => {
    const newSelected = new Set(selectedAttributes);
    if (newSelected.has(attrId)) {
      newSelected.delete(attrId);
    } else {
      newSelected.add(attrId);
    }
    setSelectedAttributes(newSelected);
  };

  const addCustomAttribute = () => {
    if (!newAttributeName.trim()) return;
    
    let newPos: THREE.Vector3;
    let isSafe = false;
    const maxAttempts = 50;
    let attempts = 0;
    const minDistance = 1.2;

    while (!isSafe && attempts < maxAttempts) {
      attempts++;
      newPos = new THREE.Vector3().setFromSphericalCoords(
        1.8,
        Math.acos(2 * Math.random() - 1),
        2 * Math.PI * Math.random()
      );

      isSafe = true;
      for (const attr of sphereAttributes) {
        if (attr.pos.distanceTo(newPos) < minDistance) {
          isSafe = false;
          break;
        }
      }
    }

    const newAttr: SphereAttribute = {
      name: newAttributeName.trim(),
      pos: newPos!,
      id: `custom-${Date.now()}`,
      isAddButton: false
    };

    setSphereAttributes([...sphereAttributes, newAttr]);
    setNewAttributeName('');
    setShowModal(false);
  };

  const getScreenPosition = (worldPos: THREE.Vector3): { x: number; y: number; visible: boolean } => {
    if (!cameraRef.current || !sphereGroupRef.current) return { x: 0, y: 0, visible: false };
    
    const worldPosition = worldPos.clone().applyMatrix4(sphereGroupRef.current.matrixWorld);
    const screenPosition = worldPosition.project(cameraRef.current);
    
    const x = (screenPosition.x * 0.5 + 0.5) * window.innerWidth;
    const y = (-screenPosition.y * 0.5 + 0.5) * window.innerHeight;
    
    return { x, y, visible: screenPosition.z < 1 };
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      addCustomAttribute();
    }
  };

  const handlePlayPause = async () => {
    const audio = audioRef.current;
    if (!audio || audioTracks.length === 0) return;

    try {
      if (isPlaying) {
        audio.pause();
      } else {
        await audio.play();
      }
    } catch (error: any) {
      console.error('Error during play/pause:', error);
      setError(`Playback failed: ${error.message}`);
      setIsPlaying(false);
    }
  };

  const handleMute = () => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const formatTime = (seconds: number) => {
    if (!seconds || !isFinite(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 bg-black text-gray-200 overflow-hidden z-50" style={{ cursor: isDragging ? 'grabbing' : 'grab' }}>
      {/* Close Button */}
      <button
        onClick={() => setLocation('/')}
        className="absolute top-4 right-4 z-20 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/20 transition-all duration-300"
        style={{ pointerEvents: 'auto' }}
      >
        <X className="w-6 h-6 text-white" />
      </button>

      {/* Canvas Container */}
      <div 
        ref={canvasRef}
        className="absolute inset-0"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        style={{ touchAction: 'none' }}
      />

      {/* Sphere Attributes */}
      {sphereAttributes.map((attr) => {
        const screenPos = getScreenPosition(attr.pos);
        return (
          <button
            key={attr.id}
            className={`absolute transform -translate-x-1/2 -translate-y-1/2 inline-flex items-center px-4 py-2 border border-gray-600 rounded-full backdrop-blur-sm transition-all duration-300 text-sm shadow-lg ${
              attr.isAddButton
                ? 'bg-white/10 border-gray-400 w-12 h-12 text-3xl text-white hover:bg-white/20'
                : selectedAttributes.has(attr.id)
                ? 'bg-white text-black border-white shadow-white/40'
                : 'bg-black/50 hover:bg-white/10 hover:border-gray-400 hover:-translate-y-1'
            } ${screenPos.visible ? 'block' : 'hidden'}`}
            style={{ 
              left: screenPos.x, 
              top: screenPos.y,
              pointerEvents: 'auto',
              zIndex: 10
            }}
            onClick={(e) => {
              e.stopPropagation();
              if (attr.isAddButton) {
                setShowModal(true);
              } else {
                toggleAttribute(attr.id);
              }
            }}
          >
            {attr.isAddButton ? (
              attr.name
            ) : (
              <>
                <span className={`mr-2 font-bold ${selectedAttributes.has(attr.id) ? 'hidden' : 'inline'}`}>+</span>
                {attr.name.toUpperCase()}
              </>
            )}
          </button>
        );
      })}

      {/* Loading Overlay */}
      {isGenerating && (
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm z-30 flex items-center justify-center">
          <div className="bg-white/10 backdrop-blur-md border-white/20 p-8 rounded-3xl shadow-2xl max-w-lg w-full text-center mx-4">
            <Loader2 className="w-16 h-16 animate-spin mx-auto text-purple-300 mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">
              Creating Your Soundscape
            </h2>
            <p className="text-gray-300 mb-4">
              {generationMessage}
            </p>
            
            <div className="w-full bg-gray-700/50 rounded-full h-3 mb-6">
              <div 
                className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full transition-all duration-500"
                style={{ width: `${generationProgress}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Audio Player UI (when audio is ready) */}
      {audioTracks.length > 0 && (
        <div className="absolute bottom-4 left-4 right-4 z-20 pointer-events-auto">
          <div className="bg-black/80 backdrop-blur-md border border-white/20 rounded-2xl p-4 shadow-2xl">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-white font-medium">
                  {audioTracks[currentTrackIndex]?.type || 'Generated Soundscape'}
                </h3>
                <div className="text-xs text-gray-400">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={handlePlayPause}
                  className="w-12 h-12 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors"
                  disabled={!audioReady}
                >
                  {isPlaying ? (
                    <Pause className="w-5 h-5 text-white" />
                  ) : (
                    <Play className="w-5 h-5 text-white ml-0.5" />
                  )}
                </button>
                <button
                  onClick={handleMute}
                  className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors"
                >
                  {isMuted ? (
                    <VolumeX className="w-4 h-4 text-white" />
                  ) : (
                    <Volume2 className="w-4 h-4 text-white" />
                  )}
                </button>
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="w-full h-2 bg-gray-700/50 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full transition-all duration-300"
                style={{ width: duration ? `${(currentTime / duration) * 100}%` : '0%' }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="absolute top-20 left-4 right-4 z-20 pointer-events-auto">
          <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-4">
            <p className="text-red-200 text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* UI Container */}
      <div className="relative z-10 flex flex-col justify-between items-center h-full p-10 pointer-events-none">
        <div></div>

        <div className="flex flex-col items-center w-full max-w-2xl pointer-events-auto">
          <div className={`mb-5 p-4 bg-gray-900/80 rounded-xl min-h-16 w-full text-center italic text-gray-400 transition-opacity duration-500 backdrop-blur-sm ${output ? 'opacity-100' : 'opacity-0'}`}>
            {output}
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              generatePersonalizedAudio();
            }}
            disabled={isGenerating || selectedAttributes.size === 0}
            className={`w-16 h-16 rounded-full flex items-center justify-center text-3xl transition-all duration-200 shadow-lg ${
              isGenerating || selectedAttributes.size === 0
                ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                : 'bg-white text-black hover:scale-110 shadow-white/50'
            }`}
            style={{ pointerEvents: 'auto' }}
          >
            {isGenerating ? (
              <Loader2 className="w-8 h-8 animate-spin" />
            ) : (
              '→'
            )}
          </button>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div 
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex justify-center items-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowModal(false);
            }
          }}
          style={{ pointerEvents: 'auto' }}
        >
          <div 
            className="bg-gray-900 p-6 rounded-2xl w-full max-w-md border border-gray-700"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold mb-4 text-center">Add a Custom Sound</h2>
            <input
              type="text"
              value={newAttributeName}
              onChange={(e) => setNewAttributeName(e.target.value)}
              onKeyUp={handleKeyPress}
              placeholder="e.g., 'Crackling Fire'"
              className="w-full p-3 rounded-lg border border-gray-600 bg-gray-800 text-gray-200 mb-5 text-base"
              autoFocus
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 p-3 rounded-lg border border-gray-600 text-gray-300 hover:bg-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={addCustomAttribute}
                className="flex-1 p-3 rounded-lg bg-white text-black font-bold hover:scale-105 transition-transform"
              >
                Add Attribute
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hidden Audio Element */}
      <audio
        ref={audioRef}
        preload="metadata"
        crossOrigin="anonymous"
        onError={(e) => {
          console.error('Audio element error:', e);
          setError('Failed to load audio track');
          setIsPlaying(false);
        }}
      />
    </div>
  );
};

export default SoundGeneratorPage;
