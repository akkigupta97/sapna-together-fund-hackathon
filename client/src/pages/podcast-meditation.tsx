import React, { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Moon, Settings, Sparkles, Headphones, Play, Volume2, Pause, MoreHorizontal, Zap, Heart, Smile, Frown, Loader2, VolumeX, Volume1 } from 'lucide-react';
import * as THREE from 'three';
import AppLayout from '@/components/layout/app-layout';

export default function PodcastMeditationPage() {
    const [selectedMode, setSelectedMode] = useState('meditation'); // 'meditation' or 'podcast'
    const [selectedPodcast, setSelectedPodcast] = useState(null);
    const [selectedTheme, setSelectedTheme] = useState(null);
    const [selectedSounds, setSelectedSounds] = useState(new Set());
    const [generatedPrompt, setGeneratedPrompt] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [customSound, setCustomSound] = useState('');
    
    // Audio TTS state
    const [isGenerating, setIsGenerating] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [audioReady, setAudioReady] = useState(false);
    const [error, setError] = useState(null);
    
    // Audio overlay state
    const [podcastVolume, setPodcastVolume] = useState(0.95);
    const [themeVolume, setThemeVolume] = useState(0.05);
    const [isOverlayReady, setIsOverlayReady] = useState(false);
    
    const audioRef = useRef(null);
    const podcastAudioRef = useRef(null);
    const themeAudioRef = useRef(null);
    const audioContextRef = useRef(null);
    const podcastSourceRef = useRef(null);
    const themeSourceRef = useRef(null);
    const podcastGainRef = useRef(null);
    const themeGainRef = useRef(null);
    const destinationRef = useRef(null);
    
    const canvasRef = useRef(null);
    const sceneRef = useRef(null);
    const rendererRef = useRef(null);
    const cameraRef = useRef(null);
    const objectsRef = useRef([]);
    const clockRef = useRef(new THREE.Clock());
    const mouseRef = useRef(new THREE.Vector2());
    const currentThemePhysicsRef = useRef({ type: 'peace' });
    const targetColorRef = useRef(new THREE.Color('#8e44ad'));
    const targetEmissiveRef = useRef(new THREE.Color('#341f97'));
    const objectGroupRef = useRef(null);
    const peaceSymbolGroupRef = useRef(null);
    const shaderMaterialRef = useRef(null);
    const isDraggingRef = useRef(false);
    const previousMousePositionRef = useRef({ x: 0, y: 0 });
    const attributeButtonsRef = useRef([]);
  
    // Mock data with audio URLs
    const podcasts = [
      { 
        id: 'p1', 
        title: 'The Midnight Gospel', 
        img: 'https://placehold.co/300x300/6a0dad/ffffff?text=TMG',
        audioUrl: 'https://sapna-assets.s3.us-east-1.amazonaws.com/podcast.mp3' // Example URL
      },
      { 
        id: 'p2', 
        title: 'Cosmic Journeys', 
        img: 'https://placehold.co/300x300/00bfff/ffffff?text=CJ',
        audioUrl: 'https://sapna-assets.s3.us-east-1.amazonaws.com/podcast.mp3'
      },
      { 
        id: 'p3', 
        title: 'Syntax Error', 
        img: 'https://placehold.co/300x300/f1c40f/000000?text=SE',
        audioUrl: 'https://sapna-assets.s3.us-east-1.amazonaws.com/podcast.mp3'
      },
      { 
        id: 'p4', 
        title: 'The Daily Grind', 
        img: 'https://placehold.co/300x300/2ecc71/ffffff?text=TDG',
        audioUrl: 'https://sapna-assets.s3.us-east-1.amazonaws.com/podcast.mp3'
      },
      { 
        id: 'p5', 
        title: 'Nocturne', 
        img: 'https://placehold.co/300x300/34495e/ffffff?text=N',
        audioUrl: 'https://sapna-assets.s3.us-east-1.amazonaws.com/podcast.mp3'
      },
    ];
  
    const themes = {
      peace: { 
        name: 'Peace', 
        color: new THREE.Color("#8e44ad"), 
        emissive: "#341f97", 
        icon: <Moon className="w-6 h-6" />, 
        style: 'bg-purple-500',
        audioUrl: 'https://sapna-assets.s3.us-east-1.amazonaws.com/peace.mp3' // Rain sounds
      },
      energy: { 
        name: 'Energy', 
        color: new THREE.Color("#f1c40f"), 
        emissive: "#f39c12", 
        icon: <Zap className="w-6 h-6" />, 
        style: 'bg-yellow-500',
        audioUrl: 'https://sapna-assets.s3.us-east-1.amazonaws.com/energetic.mp3' // Thunder sounds
      },
      sad: { 
        name: 'Sad', 
        color: new THREE.Color("#3498db"), 
        emissive: "#2980b9", 
        icon: <Frown className="w-6 h-6" />, 
        style: 'bg-blue-500',
        audioUrl: 'https://sapna-assets.s3.us-east-1.amazonaws.com/sad.mp3' // Gentle rain
      },
      happy: { 
        name: 'Happy', 
        color: new THREE.Color("#2ecc71"), 
        emissive: "#27ae60", 
        icon: <Smile className="w-6 h-6" />, 
        style: 'bg-green-500',
        audioUrl: 'https://sapna-assets.s3.us-east-1.amazonaws.com/uplifting.mp3' // Birds chirping
      },
    };
  
    const objectAttributes = [
      { name: 'OM CHANT', pos: new THREE.Vector3(0, 3.5, 0) },
      { name: 'SINGING BOWL', pos: new THREE.Vector3(-3.5, 0, 0) },
      { name: 'GENTLE WIND', pos: new THREE.Vector3(3.5, 0, 0) },
    ];

    // Initialize Web Audio API for audio mixing
    const initializeAudioContext = async () => {
      try {
        if (!audioContextRef.current) {
          audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
        }
        
        if (audioContextRef.current.state === 'suspended') {
          await audioContextRef.current.resume();
        }
        
        return audioContextRef.current;
      } catch (error) {
        console.error('Failed to initialize audio context:', error);
        setError('Audio system not supported in this browser');
        return null;
      }
    };

    // Setup audio overlay mixing
    const setupAudioOverlay = async (podcastUrl, themeUrl) => {
        try {
          setIsGenerating(true);
          setError(null);
          
          const audioContext = await initializeAudioContext();
          if (!audioContext) {
            throw new Error('Failed to initialize audio context');
          }
      
          // Clean up existing audio elements and nodes
          if (podcastAudioRef.current) {
            podcastAudioRef.current.pause();
            podcastAudioRef.current.removeEventListener('timeupdate', updateTime);
            podcastAudioRef.current.removeEventListener('loadedmetadata', updateDuration);
            podcastAudioRef.current.removeEventListener('play', handlePlay);
            podcastAudioRef.current.removeEventListener('pause', handlePause);
            podcastAudioRef.current.removeEventListener('ended', handleEnded);
          }
          if (themeAudioRef.current) {
            themeAudioRef.current.pause();
            themeAudioRef.current.removeEventListener('ended', handleThemeEnded);
          }
      
          // Create new audio elements
          const podcastAudio = new Audio();
          const themeAudio = new Audio();
          
          // Configure audio elements
          podcastAudio.crossOrigin = 'anonymous';
          themeAudio.crossOrigin = 'anonymous';
          themeAudio.loop = true;
          podcastAudio.preload = 'metadata';
          themeAudio.preload = 'metadata';
          
          // Load audio files with better error handling and timeout
          const loadAudio = (audio, url, name) => {
            return new Promise((resolve, reject) => {
              const timeout = setTimeout(() => {
                reject(new Error(`Timeout loading ${name} audio`));
              }, 30000); // 30 second timeout
              
              const onLoad = () => {
                clearTimeout(timeout);
                audio.removeEventListener('loadeddata', onLoad);
                audio.removeEventListener('error', onError);
                resolve();
              };
              
              const onError = (e) => {
                clearTimeout(timeout);
                audio.removeEventListener('loadeddata', onLoad);
                audio.removeEventListener('error', onError);
                reject(new Error(`Failed to load ${name}: ${e.message || 'Unknown error'}`));
              };
              
              audio.addEventListener('loadeddata', onLoad);
              audio.addEventListener('error', onError);
              audio.src = url;
            });
          };
      
          // Load both audio files
          await Promise.all([
            loadAudio(podcastAudio, podcastUrl, 'podcast'),
            loadAudio(themeAudio, themeUrl, 'theme')
          ]);
      
          // Verify audio context is still valid
          if (audioContext.state === 'closed') {
            throw new Error('Audio context was closed during setup');
          }
      
          // Create audio sources and nodes
          const podcastSource = audioContext.createMediaElementSource(podcastAudio);
          const themeSource = audioContext.createMediaElementSource(themeAudio);
          
          const podcastGain = audioContext.createGain();
          const themeGain = audioContext.createGain();
          const masterGain = audioContext.createGain();
          
          // Set initial volumes with validation
          const setPodcastVol = Math.max(0, Math.min(1, podcastVolume || 0.8));
          const setThemeVol = Math.max(0, Math.min(1, themeVolume || 0.3));
          
          podcastGain.gain.setValueAtTime(setPodcastVol, audioContext.currentTime);
          themeGain.gain.setValueAtTime(setThemeVol, audioContext.currentTime);
          masterGain.gain.setValueAtTime(1.0, audioContext.currentTime);
          
          // Connect the audio graph
          podcastSource.connect(podcastGain);
          themeSource.connect(themeGain);
          podcastGain.connect(masterGain);
          themeGain.connect(masterGain);
          masterGain.connect(audioContext.destination);
          
          // Store audio durations for length comparison
          const podcastDuration = podcastAudio.duration || 0;
          const themeDuration = themeAudio.duration || 0;
          
          // Define event handlers
          const updateTime = () => {
            if (podcastAudio && !podcastAudio.paused) {
              setCurrentTime(podcastAudio.currentTime);
              
              // Sync theme audio position if it's not looping and lengths are different
              if (themeAudio && !themeAudio.loop && themeDuration > 0) {
                const podcastProgress = podcastAudio.currentTime / podcastDuration;
                const expectedThemeTime = podcastProgress * themeDuration;
                
                // Only sync if there's a significant drift (> 0.5 seconds)
                if (Math.abs(themeAudio.currentTime - expectedThemeTime) > 0.5) {
                  themeAudio.currentTime = expectedThemeTime;
                }
              }
            }
          };
          
          const updateDuration = () => {
            if (podcastAudio && podcastAudio.duration && isFinite(podcastAudio.duration)) {
              setDuration(podcastAudio.duration);
            }
          };
          
          const handlePlay = () => {
            setIsPlaying(true);
            
            // Start theme audio when podcast starts
            if (themeAudio && themeAudio.paused) {
              // If theme is shorter than podcast and not looping, sync the start position
              if (!themeAudio.loop && themeDuration > 0 && podcastDuration > themeDuration) {
                const podcastProgress = podcastAudio.currentTime / podcastDuration;
                themeAudio.currentTime = Math.min(podcastProgress * themeDuration, themeDuration - 0.1);
              }
              
              themeAudio.play().catch(console.error);
            }
          };
          
          const handlePause = () => {
            setIsPlaying(false);
            // Pause theme audio when podcast pauses
            if (themeAudio && !themeAudio.paused) {
              themeAudio.pause();
            }
          };
          
          const handleEnded = () => {
            setIsPlaying(false);
            if (themeAudio && !themeAudio.paused) {
              themeAudio.pause();
            }
          };
          
          // Handle theme audio ending before podcast (if not looping)
          const handleThemeEnded = () => {
            if (!themeAudio.loop && podcastAudio && !podcastAudio.paused) {
              // If podcast is still playing but theme ended, restart theme or fade it out
              if (podcastAudio.currentTime < podcastDuration - 1) {
                // Restart theme audio
                themeAudio.currentTime = 0;
                themeAudio.play().catch(console.error);
              }
            }
          };
          
          // Add event listeners
          podcastAudio.addEventListener('timeupdate', updateTime);
          podcastAudio.addEventListener('loadedmetadata', updateDuration);
          podcastAudio.addEventListener('play', handlePlay);
          podcastAudio.addEventListener('pause', handlePause);
          podcastAudio.addEventListener('ended', handleEnded);
          
          // Add theme audio event listener for when it ends
          themeAudio.addEventListener('ended', handleThemeEnded);
          
          // Configure theme audio behavior based on length comparison
          if (podcastDuration > 0 && themeDuration > 0) {
            if (themeDuration < podcastDuration * 0.8) {
              // If theme is significantly shorter, enable looping
              themeAudio.loop = true;
              console.log(`Theme audio (${Math.round(themeDuration)}s) is shorter than podcast (${Math.round(podcastDuration)}s), enabling loop`);
            } else if (themeDuration > podcastDuration * 1.2) {
              // If theme is significantly longer, disable looping and it will be cut off
              themeAudio.loop = false;
              console.log(`Theme audio (${Math.round(themeDuration)}s) is longer than podcast (${Math.round(podcastDuration)}s), will be trimmed`);
            } else {
              // Lengths are similar, disable looping for natural sync
              themeAudio.loop = false;
              console.log(`Theme and podcast durations are similar, syncing naturally`);
            }
          }
          
          // Store references
          podcastAudioRef.current = podcastAudio;
          themeAudioRef.current = themeAudio;
          podcastSourceRef.current = podcastSource;
          themeSourceRef.current = themeSource;
          podcastGainRef.current = podcastGain;
          themeGainRef.current = themeGain;
          destinationRef.current = masterGain;
          
          // Update duration if already available
          if (podcastAudio.duration && isFinite(podcastAudio.duration)) {
            setDuration(podcastAudio.duration);
          }
          
          setIsOverlayReady(true);
          setAudioReady(true);
          setGeneratedPrompt(
            `"${selectedPodcast?.title || 'Audio'}" is ready with ${selectedTheme?.name?.toLowerCase() || 'selected'} theme overlay. Press play to begin.`
          );
          
        } catch (error) {
          console.error('Failed to setup audio overlay:', error);
          setError(`Failed to setup audio mixing: ${error.message}`);
          setIsOverlayReady(false);
          setAudioReady(false);
        } finally {
          setIsGenerating(false);
        }
      };

    // Generate meditation text based on selected attributes
    const generateMeditationText = (selectedAttributes) => {
      const attributeList = Array.from(selectedAttributes);
      
      let meditationText = "Welcome to your personalized meditation session. ";
      meditationText += "Find a comfortable position, close your eyes, and take a deep breath. ";
      
      if (attributeList.includes('OM CHANT')) {
        meditationText += "Allow the sacred sound of Om to resonate through your being, connecting you to the universal energy. ";
      }
      
      if (attributeList.includes('SINGING BOWL')) {
        meditationText += "Feel the healing vibrations of the singing bowl washing over you, releasing tension from every cell. ";
      }
      
      if (attributeList.includes('GENTLE WIND')) {
        meditationText += "Imagine a gentle breeze flowing through your consciousness, carrying away all worries and stress. ";
      }
      
      // Add custom sounds
      const customSounds = attributeList.filter(attr => 
        !['OM CHANT', 'SINGING BOWL', 'GENTLE WIND'].includes(attr)
      );
      
      if (customSounds.length > 0) {
        meditationText += `Let the soothing sounds of ${customSounds.join(' and ').toLowerCase()} guide you deeper into relaxation. `;
      }
      
      meditationText += "Breathe naturally and allow yourself to sink into a state of peaceful awareness. ";
      meditationText += "With each breath, you become more relaxed, more centered, more at peace. ";
      meditationText += "Take your time to enjoy this moment of tranquility. When you're ready, gently open your eyes and return to the present moment.";
      
      return meditationText;
    };

    // Generate TTS audio using Groq API
    const generateTTSAudio = async (text) => {
      try {
        setIsGenerating(true);
        setError(null);
        
        const response = await fetch('https://api.groq.com/openai/v1/audio/speech', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'playai-tts',
            input: text,
            voice: 'Indigo-PlayAI',
            response_format: 'wav'
          })
        });

        if (!response.ok) {
          throw new Error(`TTS API error: ${response.status} ${response.statusText}`);
        }

        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        
        // Load the audio
        if (audioRef.current) {
          audioRef.current.src = audioUrl;
          audioRef.current.load();
          setAudioReady(true);
          
          // Auto-play the generated meditation
          setTimeout(() => {
            audioRef.current.play().catch(console.error);
          }, 500);
        }
        
        return audioUrl;
      } catch (error) {
        console.error('TTS generation failed:', error);
        setError(`Failed to generate meditation audio: ${error.message}`);
        throw error;
      } finally {
        setIsGenerating(false);
      }
    };

    // Audio event listeners for meditation mode
    useEffect(() => {
      if (selectedMode !== 'meditation') return;
      
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
    }, [duration, selectedMode]);

    // Audio control functions
    const handlePlayPause = async () => {
      if (selectedMode === 'meditation') {
        const audio = audioRef.current;
        if (!audio) return;

        try {
          if (isPlaying) {
            audio.pause();
          } else {
            await audio.play();
          }
        } catch (error) {
          console.error('Error during play/pause:', error);
          setError(`Playback failed: ${error.message}`);
          setIsPlaying(false);
        }
      } else {
        // Podcast mode with overlay
        const podcastAudio = podcastAudioRef.current;
        const themeAudio = themeAudioRef.current;
        
        if (!podcastAudio || !themeAudio) return;

        try {
          if (isPlaying) {
            podcastAudio.pause();
            themeAudio.pause();
          } else {
            // Start both audios synchronized
            await Promise.all([
              podcastAudio.play(),
              themeAudio.play()
            ]);
          }
        } catch (error) {
          console.error('Error during overlay play/pause:', error);
          setError(`Overlay playback failed: ${error.message}`);
          setIsPlaying(false);
        }
      }
    };

    const handleMute = () => {
      if (selectedMode === 'meditation') {
        const audio = audioRef.current;
        if (!audio) return;

        audio.muted = !isMuted;
        setIsMuted(!isMuted);
      } else {
        // Mute both podcast and theme
        const podcastAudio = podcastAudioRef.current;
        const themeAudio = themeAudioRef.current;
        
        if (podcastAudio && themeAudio) {
          const newMutedState = !isMuted;
          podcastGainRef.current.gain.value = newMutedState ? 0 : podcastVolume;
          themeGainRef.current.gain.value = newMutedState ? 0 : themeVolume;
          setIsMuted(newMutedState);
        }
      }
    };

    // Volume control for podcast overlay
    const handlePodcastVolumeChange = (newVolume) => {
      setPodcastVolume(newVolume);
      if (podcastGainRef.current && !isMuted) {
        podcastGainRef.current.gain.value = newVolume;
      }
    };

    const handleThemeVolumeChange = (newVolume) => {
      setThemeVolume(newVolume);
      if (themeGainRef.current && !isMuted) {
        themeGainRef.current.gain.value = newVolume;
      }
    };

    const formatTime = (seconds) => {
      if (!seconds || !isFinite(seconds)) return "0:00";
      const mins = Math.floor(seconds / 60);
      const secs = Math.floor(seconds % 60);
      return `${mins}:${secs.toString().padStart(2, '0')}`;
    };
  
    // Initialize Three.js scene
    useEffect(() => {
      if (!canvasRef.current) return;
  
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setClearColor(0x000000, 0);
      canvasRef.current.appendChild(renderer.domElement);
      camera.position.z = 7;
  
      sceneRef.current = scene;
      rendererRef.current = renderer;
      cameraRef.current = camera;
  
      if (selectedMode === 'meditation') {
        // Meditation mode - exact copy from meditation_peace.html
        
        // Lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
        scene.add(ambientLight);
        const pointLight1 = new THREE.PointLight(0x6a0dad, 1.5, 100);
        pointLight1.position.set(5, 5, 5);
        scene.add(pointLight1);
        const pointLight2 = new THREE.PointLight(0x00bfff, 1.5, 100);
        pointLight2.position.set(-5, -5, -5);
        scene.add(pointLight2);
  
        // Artistic Object Group
        const objectGroup = new THREE.Group();
        scene.add(objectGroup);
        objectGroupRef.current = objectGroup;
  
        // Custom Shader Material for Glowing/Pulsating Effect - exact same as HTML
        const vertexShader = `
          uniform float time;
          varying vec3 vNormal;
          varying vec3 vPosition;
          void main() {
            vNormal = normal;
            vPosition = position;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `;
        const fragmentShader = `
          uniform float time;
          varying vec3 vNormal;
          varying vec3 vPosition;
          
          // Simplex Noise function for organic color variation
          vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
          vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
          vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
          vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
          float snoise(vec3 v) {
            const vec2 C = vec2(1.0/6.0, 1.0/3.0);
            const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
            vec3 i = floor(v + dot(v, C.yyy));
            vec3 x0 = v - i + dot(i, C.xxx);
            vec3 g = step(x0.yzx, x0.xyz);
            vec3 l = 1.0 - g;
            vec3 i1 = min(g.xyz, l.zxy);
            vec3 i2 = max(g.xyz, l.zxy);
            vec3 x1 = x0 - i1 + C.xxx;
            vec3 x2 = x0 - i2 + C.yyy;
            vec3 x3 = x0 - D.yyy;
            i = mod289(i);
            vec4 p = permute(permute(permute(
              i.z + vec4(0.0, i1.z, i2.z, 1.0))
              + i.y + vec4(0.0, i1.y, i2.y, 1.0))
              + i.x + vec4(0.0, i1.x, i2.x, 1.0));
            float n_ = 0.142857142857;
            vec3 ns = n_ * D.wyz - D.xzx;
            vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
            vec4 x_ = floor(j * ns.z);
            vec4 y_ = floor(j - 7.0 * x_);
            vec4 x = x_ * ns.x + ns.yyyy;
            vec4 y = y_ * ns.x + ns.yyyy;
            vec4 h = 1.0 - abs(x) - abs(y);
            vec4 b0 = vec4(x.xy, y.xy);
            vec4 b1 = vec4(x.zw, y.zw);
            vec4 s0 = floor(b0) * 2.0 + 1.0;
            vec4 s1 = floor(b1) * 2.0 + 1.0;
            vec4 sh = -step(h, vec4(0.0));
            vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
            vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
            vec3 p0 = vec3(a0.xy, h.x);
            vec3 p1 = vec3(a0.zw, h.y);
            vec3 p2 = vec3(a1.xy, h.z);
            vec3 p3 = vec3(a1.zw, h.w);
            vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
            p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
            vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
            m = m * m;
            return 42.0 * dot(m*m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
          }
  
          void main() {
            float intensity = pow(0.6 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);
            vec3 color1 = vec3(0.42, 0.05, 0.84); // Deep Purple
            vec3 color2 = vec3(0.0, 0.75, 1.0); // Deep Sky Blue
            float noise = (snoise(vPosition * 1.5 + time * 0.1) + 1.0) / 2.0; // Slower pulse
            vec3 finalColor = mix(color1, color2, noise);
            gl_FragColor = vec4(finalColor, 1.0) * intensity;
          }
        `;
        const shaderMaterial = new THREE.ShaderMaterial({
          uniforms: { time: { value: 0.0 } },
          vertexShader,
          fragmentShader,
          transparent: true,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
          side: THREE.DoubleSide
        });
        shaderMaterialRef.current = shaderMaterial;
  
        // Peace Symbol Creation - exact same as HTML
        const peaceSymbolGroup = new THREE.Group();
        objectGroup.add(peaceSymbolGroup);
        peaceSymbolGroupRef.current = peaceSymbolGroup;
  
        const tubeRadius = 0.2;
        const radius = 2.2;
  
        // Outer circle
        const circleGeom = new THREE.TorusGeometry(radius, tubeRadius, 16, 100);
        const circle = new THREE.Mesh(circleGeom, shaderMaterial);
        peaceSymbolGroup.add(circle);
  
        // Vertical line
        const verticalPath = new THREE.LineCurve3(new THREE.Vector3(0, radius, 0), new THREE.Vector3(0, -radius, 0));
        const verticalGeom = new THREE.TubeGeometry(verticalPath, 20, tubeRadius, 8, false);
        const verticalLine = new THREE.Mesh(verticalGeom, shaderMaterial);
        peaceSymbolGroup.add(verticalLine);
  
        // Left angled line
        const leftPath = new THREE.LineCurve3(new THREE.Vector3(0, 0, 0), new THREE.Vector3(-radius * Math.cos(Math.PI/4), -radius * Math.sin(Math.PI/4), 0));
        const leftGeom = new THREE.TubeGeometry(leftPath, 20, tubeRadius, 8, false);
        const leftLine = new THREE.Mesh(leftGeom, shaderMaterial);
        peaceSymbolGroup.add(leftLine);
  
        // Right angled line
        const rightPath = new THREE.LineCurve3(new THREE.Vector3(0, 0, 0), new THREE.Vector3(radius * Math.cos(Math.PI/4), -radius * Math.sin(Math.PI/4), 0));
        const rightGeom = new THREE.TubeGeometry(rightPath, 20, tubeRadius, 8, false);
        const rightLine = new THREE.Mesh(rightGeom, shaderMaterial);
        peaceSymbolGroup.add(rightLine);
  
      } else {
        // Podcast mode - exact copy from podcast.html
        
        // Custom Geometries for Themes - exact same as HTML
        const geometries = {
          peace: new THREE.TorusKnotGeometry(0.15, 0.05, 100, 16),
          energy: new THREE.IcosahedronGeometry(0.2, 0),
          sad: new THREE.LatheGeometry([
            new THREE.Vector2(0, 0),
            new THREE.Vector2(0.1, 0),
            new THREE.Vector2(0.15, 0.3),
            new THREE.Vector2(0, 0.4)
          ], 12),
          happy: new THREE.SphereGeometry(0.15, 16, 16)
        };
  
        // 3D Objects Background - exact same count and setup
        const objectCount = 150;
        const objects = [];
        
        for (let i = 0; i < objectCount; i++) {
          const material = new THREE.MeshStandardMaterial({
            color: themes.peace.color,
            emissive: themes.peace.emissive,
            emissiveIntensity: 0.5,
            metalness: 0.1,
            roughness: 0.4
          });
          const object = new THREE.Mesh(geometries.peace, material);
          object.position.set(
            (Math.random() - 0.5) * 15,
            (Math.random() - 0.5) * 15,
            (Math.random() - 0.5) * 15
          );
          object.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
          object.velocity = new THREE.Vector3(
            (Math.random() - 0.5) * 0.01,
            (Math.random() - 0.5) * 0.01,
            (Math.random() - 0.5) * 0.01
          );
          objects.push(object);
          scene.add(object);
        }
        objectsRef.current = objects;
      }
  
      // Animation loop
      const animate = () => {
        const elapsedTime = clockRef.current.getElapsedTime();
  
        if (selectedMode === 'meditation') {
          // Meditation animation - exact same as HTML
          if (shaderMaterialRef.current) {
            shaderMaterialRef.current.uniforms.time.value = elapsedTime;
          }
  
          // Add a slow, subtle "breathing" scale animation
          const scalePulse = (Math.sin(elapsedTime * 0.2) * 0.01) + 1.0;
          if (objectGroupRef.current) {
            objectGroupRef.current.scale.set(scalePulse, scalePulse, scalePulse);
            
            if (!isDraggingRef.current) {
              objectGroupRef.current.rotation.y += 0.0008;
            }
          }
  
        } else {
          // Podcast animation - exact same as HTML
          const delta = clockRef.current.getDelta();
          
          objectsRef.current.forEach(obj => {
            obj.position.add(obj.velocity);
  
            // Theme-based physics - exact same as HTML
            switch(currentThemePhysicsRef.current.type) {
              case 'peace':
                obj.rotation.x += delta * 0.1;
                obj.rotation.y += delta * 0.1;
                break;
              case 'energy':
                obj.rotation.x += delta * 2;
                obj.rotation.y += delta * 2;
                obj.velocity.x += (Math.random() - 0.5) * 0.005;
                obj.velocity.y += (Math.random() - 0.5) * 0.005;
                obj.velocity.z += (Math.random() - 0.5) * 0.005;
                obj.velocity.clampLength(0, 0.05);
                break;
              case 'sad':
                obj.velocity.y -= 0.0001; // Gravity
                obj.rotation.x += delta * 0.05;
                break;
              case 'happy':
                obj.velocity.y += (Math.random()) * 0.0002;
                obj.rotation.x += delta * 0.5;
                obj.rotation.y += delta * 0.5;
                break;
            }
  
            // Boundary check - exact same
            if (obj.position.y < -8) obj.position.y = 8;
            if (obj.position.y > 8) obj.position.y = -8;
            if (obj.position.x < -8) obj.position.x = 8;
            if (obj.position.x > 8) obj.position.x = -8;
            if (obj.position.z < -8) obj.position.z = 8;
            if (obj.position.z > 8) obj.position.z = -8;
  
            // Lerp color - exact same
            obj.material.color.lerp(targetColorRef.current, 0.05);
            obj.material.emissive.lerp(targetEmissiveRef.current, 0.05);
          });
  
          // Camera parallax effect - exact same
          camera.position.x += (mouseRef.current.x * 2 - camera.position.x) * 0.05;
          camera.position.y += (-mouseRef.current.y * 2 - camera.position.y) * 0.05;
          camera.lookAt(scene.position);
        }
  
        renderer.render(scene, camera);
        requestAnimationFrame(animate);
      };
  
      animate();
  
      // Mouse/Touch Controls for meditation mode - exact same as HTML
      const onPointerDown = (event) => {
        if (selectedMode !== 'meditation') return;
        if (event.target.closest('button, input')) return;
        isDraggingRef.current = true;
        document.body.style.cursor = 'grabbing';
        const clientX = event.clientX || (event.touches && event.touches[0].clientX);
        const clientY = event.clientY || (event.touches && event.touches[0].clientY);
        previousMousePositionRef.current = { x: clientX, y: clientY };
      };
  
      const onPointerMove = (event) => {
        if (selectedMode === 'podcast') {
          // Podcast mouse move
          mouseRef.current.x = (event.clientX / window.innerWidth) * 2 - 1;
          mouseRef.current.y = -(event.clientY / window.innerHeight) * 2 + 1;
        } else if (selectedMode === 'meditation') {
          // Meditation mouse move
          if (!isDraggingRef.current) return;
          const clientX = event.clientX || (event.touches && event.touches[0].clientX);
          const clientY = event.clientY || (event.touches && event.touches[0].clientY);
          if (objectGroupRef.current) {
            objectGroupRef.current.rotation.y += (clientX - previousMousePositionRef.current.x) * 0.005;
            objectGroupRef.current.rotation.x += (clientY - previousMousePositionRef.current.y) * 0.005;
          }
          previousMousePositionRef.current = { x: clientX, y: clientY };
        }
      };
  
      const onPointerUp = () => {
        isDraggingRef.current = false;
        document.body.style.cursor = 'grab';
      };
  
      // Resize handler
      const handleResize = () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
      };
  
      document.body.addEventListener('mousedown', onPointerDown);
      document.body.addEventListener('mousemove', onPointerMove);
      window.addEventListener('mouseup', onPointerUp);
      document.body.addEventListener('touchstart', onPointerDown, { passive: false });
      document.body.addEventListener('touchmove', onPointerMove, { passive: false });
      window.addEventListener('touchend', onPointerUp);
      window.addEventListener('resize', handleResize);
  
      return () => {
        document.body.removeEventListener('mousedown', onPointerDown);
        document.body.removeEventListener('mousemove', onPointerMove);
        window.removeEventListener('mouseup', onPointerUp);
        document.body.removeEventListener('touchstart', onPointerDown);
        document.body.removeEventListener('touchmove', onPointerMove);
        window.removeEventListener('touchend', onPointerUp);
        window.removeEventListener('resize', handleResize);
        if (canvasRef.current && renderer.domElement && canvasRef.current.contains(renderer.domElement)) {
          canvasRef.current.removeChild(renderer.domElement);
        }
        renderer.dispose();
      };
    }, [selectedMode]);
  
    // Handle theme change for podcast mode - exact same logic as HTML
    const handleThemeChange = (themeKey, theme) => {
      setSelectedTheme(theme);
      targetColorRef.current.set(theme.color);
      targetEmissiveRef.current.set(theme.emissive);
      currentThemePhysicsRef.current.type = themeKey;
  
      // Change geometry for all objects - exact same as HTML
      if (objectsRef.current.length > 0) {
        const geometries = {
          peace: new THREE.TorusKnotGeometry(0.15, 0.05, 100, 16),
          energy: new THREE.IcosahedronGeometry(0.2, 0),
          sad: new THREE.LatheGeometry([
            new THREE.Vector2(0, 0),
            new THREE.Vector2(0.1, 0),
            new THREE.Vector2(0.15, 0.3),
            new THREE.Vector2(0, 0.4)
          ], 12),
          happy: new THREE.SphereGeometry(0.15, 16, 16)
        };
  
        const newGeometry = geometries[themeKey];
        objectsRef.current.forEach(obj => {
          obj.geometry.dispose();
          obj.geometry = newGeometry;
        });
        
        // Reset velocities for new theme
        objectsRef.current.forEach(obj => {
          obj.velocity.set(
            (Math.random() - 0.5) * 0.01,
            (Math.random() - 0.5) * 0.01,
            (Math.random() - 0.5) * 0.01
          );
        });
      }
    };
  
    const handleGenerate = async () => {
      if (selectedMode === 'podcast' && selectedPodcast && selectedTheme) {
        // Setup audio overlay instead of just showing message
        await setupAudioOverlay(selectedPodcast.audioUrl, selectedTheme.audioUrl);
      } else if (selectedMode === 'meditation' && selectedSounds.size > 0) {
        const meditationText = generateMeditationText(selectedSounds);
        setGeneratedPrompt('Generating your personalized meditation...');
        
        try {
          await generateTTSAudio(meditationText);
          setGeneratedPrompt('Your meditation is ready. Listen and relax.');
        } catch (error) {
          setGeneratedPrompt('Failed to generate meditation. Please try again.');
        }
      } else {
        if (selectedMode === 'podcast') {
          setGeneratedPrompt('Select a podcast and a theme to begin.');
        } else {
          setGeneratedPrompt('Please select at least one sound.');
        }
      }
    };
  
    const toggleSound = (soundName) => {
      const newSounds = new Set(selectedSounds);
      if (newSounds.has(soundName)) {
        newSounds.delete(soundName);
      } else {
        newSounds.add(soundName);
      }
      setSelectedSounds(newSounds);
    };
  
    const addCustomSound = () => {
      if (customSound.trim()) {
        const newSounds = new Set(selectedSounds);
        newSounds.add(customSound.trim().toUpperCase());
        setSelectedSounds(newSounds);
        setCustomSound('');
        setShowModal(false);
      }
    };
  
    const canGenerate = () => {
      if (selectedMode === 'podcast') {
        return selectedPodcast && selectedTheme;
      } else {
        return selectedSounds.size > 0;
      }
    };

    return (
        <AppLayout>
      <div style={{ 
        fontFamily: 'Inter, sans-serif', // Uniform font
        backgroundColor: '#0a0a0a', // Uniform background
        color: '#E0E0E0',
        overflow: 'hidden',
        cursor: selectedMode === 'meditation' ? 'grab' : 'default',
        position: 'relative',
        minHeight: '100vh'
      }}>
        {/* Canvas Container */}
        <div ref={canvasRef} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0 }} />

        {/* Loading Overlay */}
        {isGenerating && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="bg-white/10 backdrop-blur-md border-white/20 p-8 rounded-3xl shadow-2xl max-w-lg w-full text-center mx-4">
              <Loader2 className="w-16 h-16 animate-spin mx-auto text-purple-300 mb-4" />
              <h2 className="text-2xl font-bold text-white mb-2">
                {selectedMode === 'meditation' ? 'Creating Your Meditation' : 'Setting Up Audio Overlay'}
              </h2>
              <p className="text-gray-300 mb-4">
                {selectedMode === 'meditation' ? 
                  'Generating personalized meditation guidance...' : 
                  'Mixing podcast with theme audio...'}
              </p>
            </div>
          </div>
        )}

        {/* Audio Player UI - Enhanced for podcast overlay */}
        {audioReady && (
          <div className="fixed bottom-4 left-4 right-4 z-20">
            <div className="bg-black/80 backdrop-blur-md border border-white/20 rounded-2xl p-4 shadow-2xl">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-white font-medium">
                    {selectedMode === 'meditation' ? 
                      'Personalized Meditation' : 
                      `${selectedPodcast?.title} + ${selectedTheme?.name}`}
                  </h3>
                  <div className="text-xs text-gray-400">
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handlePlayPause}
                    className="w-12 h-12 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors"
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
              <div className="w-full h-2 bg-gray-700/50 rounded-full overflow-hidden mb-3">
                <div 
                  className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full transition-all duration-300"
                  style={{ width: duration ? `${(currentTime / duration) * 100}%` : '0%' }}
                />
              </div>

              {/* Volume Controls for Podcast Mode */}
              {selectedMode === 'podcast' && isOverlayReady && (
                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-white/10">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-400">Podcast</span>
                      <span className="text-xs text-white">{Math.round(podcastVolume * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={podcastVolume}
                      onChange={(e) => handlePodcastVolumeChange(parseFloat(e.target.value))}
                      className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-400">Theme</span>
                      <span className="text-xs text-white">{Math.round(themeVolume * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={themeVolume}
                      onChange={(e) => handleThemeVolumeChange(parseFloat(e.target.value))}
                      className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="fixed top-20 left-4 right-4 z-20">
            <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-4">
              <p className="text-red-200 text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* Top Tab Selector - Always visible */}
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-20">
          <div className="flex bg-slate-900/80 backdrop-blur-md border border-white/20 rounded-2xl p-1">
            <Button
              onClick={() => setSelectedMode('meditation')}
              className={`px-3 sm:px-4 py-2 rounded-xl font-medium transition-all duration-300 text-sm sm:text-base ${
                selectedMode === 'meditation'
                  ? 'bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow-lg'
                  : 'bg-transparent text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <Moon className="w-4 h-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Meditation</span>
              <span className="sm:hidden">Med</span>
            </Button>
            <Button
              onClick={() => setSelectedMode('podcast')}
              className={`px-3 sm:px-4 py-2 rounded-xl font-medium transition-all duration-300 text-sm sm:text-base ${
                selectedMode === 'podcast'
                  ? 'bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow-lg'
                  : 'bg-transparent text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <Headphones className="w-4 h-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Podcast</span>
              <span className="sm:hidden">Pod</span>
            </Button>
          </div>
        </div>

        {/* UI Container */}
        <div className="relative z-10 px-3 sm:px-4 md:px-6 pt-20 pb-6 space-y-4 sm:space-y-6" style={{
          pointerEvents: selectedMode === 'meditation' ? 'none' : 'auto'
        }}>
          
          {selectedMode === 'meditation' ? (
            // Meditation Mode UI
            <div className="flex flex-col items-center justify-center min-h-[calc(100vh-120px)] space-y-8" style={{ pointerEvents: 'auto' }}>
              
              {/* Object Attributes positioned around center */}
              <div className="relative w-full max-w-lg h-80 sm:h-96">
                {objectAttributes.map((attr, index) => (
                  <button
                    key={index}
                    onClick={() => toggleSound(attr.name)}
                    className={`absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-300 hover:scale-105 hover:bg-white/10 hover:border-gray-400 ${
                      selectedSounds.has(attr.name) ? 'selected' : ''
                    }`}
                    style={{
                      left: index === 1 ? '15%' : index === 2 ? '85%' : '50%',
                      top: index === 0 ? '20%' : '50%',
                      display: 'inline-flex',
                      alignItems: 'center',
                      padding: '8px 12px',
                      border: selectedSounds.has(attr.name) ? '1px solid #ffffff' : '1px solid #4A4A4A',
                      borderRadius: '9999px',
                      backgroundColor: selectedSounds.has(attr.name) ? '#ffffff' : 'rgba(10, 10, 10, 0.5)',
                      backdropFilter: 'blur(8px)',
                      WebkitBackdropFilter: 'blur(8px)',
                      cursor: 'pointer',
                      fontSize: '12px',
                      boxShadow: selectedSounds.has(attr.name) ? '0 0 20px rgba(255,255,255,0.4)' : '0 4px 15px rgba(0,0,0,0.2)',
                      color: selectedSounds.has(attr.name) ? '#000000' : '#E0E0E0'
                    }}
                  >
                    <span className="plus-icon" style={{ 
                      marginRight: '6px', 
                      fontWeight: 'bold',
                      display: selectedSounds.has(attr.name) ? 'none' : 'inline-block'
                    }}>+</span>
                    <span className="text-xs sm:text-sm">{attr.name}</span>
                  </button>
                ))}
                
                {/* Add Custom Button */}
                <button
                  onClick={() => setShowModal(true)}
                  className="absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-200 hover:scale-110 hover:bg-white/20"
                  style={{
                    left: '50%',
                    top: '80%',
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid #888',
                    width: '40px',
                    height: '40px',
                    fontSize: '24px',
                    color: '#fff',
                    borderRadius: '50%',
                    cursor: 'pointer'
                  }}
                >
                  +
                </button>

                {/* Custom sounds display */}
                {Array.from(selectedSounds).filter(sound => 
                  !objectAttributes.some(attr => attr.name === sound)
                ).map((customSound, index) => (
                  <button
                    key={customSound}
                    onClick={() => toggleSound(customSound)}
                    className="absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-300 hover:scale-105"
                    style={{
                      left: `${30 + (index * 40)}%`,
                      top: '65%',
                      display: 'inline-flex',
                      alignItems: 'center',
                      padding: '8px 12px',
                      border: '1px solid #ffffff',
                      borderRadius: '9999px',
                      backgroundColor: '#ffffff',
                      backdropFilter: 'blur(8px)',
                      WebkitBackdropFilter: 'blur(8px)',
                      cursor: 'pointer',
                      fontSize: '12px',
                      boxShadow: '0 0 20px rgba(255,255,255,0.4)',
                      color: '#000000'
                    }}
                  >
                    <span className="text-xs sm:text-sm">{customSound}</span>
                  </button>
                ))}
              </div>

              {/* Generate Section */}
              <div className="flex flex-col items-center w-full max-w-2xl space-y-6">
                <div 
                  className={`p-4 rounded-xl min-h-12 w-full text-center italic transition-opacity duration-500 ${generatedPrompt ? 'opacity-100' : 'opacity-0'}`}
                  style={{
                    backgroundColor: 'rgba(26, 26, 26, 0.8)',
                    backdropFilter: 'blur(5px)',
                    color: generatedPrompt ? '#E0E0E0' : '#a0a0a0'
                  }}
                >
                  {generatedPrompt || "Click 'Generate' to create a meditation prompt."}
                </div>
                <button
                  onClick={handleGenerate}
                  disabled={!canGenerate() || isGenerating}
                  className="w-16 h-16 rounded-full flex items-center justify-center text-3xl transition-all duration-300 hover:scale-110"
                  style={{
                    backgroundColor: canGenerate() && !isGenerating ? '#ffffff' : 'rgba(96, 96, 96, 0.5)',
                    color: canGenerate() && !isGenerating ? '#000000' : '#a0a0a0',
                    cursor: canGenerate() && !isGenerating ? 'pointer' : 'not-allowed',
                    boxShadow: canGenerate() && !isGenerating ? '0 0 25px rgba(255,255,255,0.5)' : 'none',
                    opacity: canGenerate() && !isGenerating ? 1 : 0.5
                  }}
                >
                  {isGenerating ? (
                    <Loader2 className="w-8 h-8 animate-spin" />
                  ) : (
                    '→'
                  )}
                </button>
              </div>
            </div>
          ) : (
            // Podcast Mode UI
            <div className="w-full max-w-5xl mx-auto flex flex-col gap-6 sm:gap-8">
              
              {/* Podcast Selector */}
              <section className="p-4 sm:p-6 bg-slate-900/20 backdrop-blur-md border border-white/10 rounded-2xl">
                <h2 className="text-xl sm:text-2xl font-bold text-white mb-4 text-center">1. Select a Podcast</h2>
                <div className="flex overflow-x-auto space-x-4 sm:space-x-6 pb-4">
                  {podcasts.map((podcast) => (
                    <div
                      key={podcast.id}
                      onClick={() => setSelectedPodcast(podcast)}
                      className={`flex-shrink-0 w-32 sm:w-40 text-center cursor-pointer transition-all duration-300 hover:scale-105 hover:-translate-y-2 ${
                        selectedPodcast?.id === podcast.id ? 'scale-105 -translate-y-2' : ''
                      }`}
                      style={{
                        border: selectedPodcast?.id === podcast.id ? '2px solid #ffffff' : '2px solid transparent',
                        borderRadius: '1rem',
                        boxShadow: selectedPodcast?.id === podcast.id ? '0 0 30px rgba(255, 255, 255, 0.3)' : 'none'
                      }}
                    >
                      <img src={podcast.img} alt={podcast.title} className="w-full h-32 sm:h-40 object-cover rounded-lg mb-2" />
                      <h3 className="text-white font-semibold text-sm sm:text-base truncate px-1">{podcast.title}</h3>
                    </div>
                  ))}
                </div>
              </section>

              {/* Theme Selector */}
              <section className="p-4 sm:p-6 bg-slate-900/20 backdrop-blur-md border border-white/10 rounded-2xl">
                <h2 className="text-xl sm:text-2xl font-bold text-white mb-6 text-center">2. Choose a Theme</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
                  {Object.entries(themes).map(([key, theme]) => (
                    <button
                      key={key}
                      onClick={() => handleThemeChange(key, theme)}
                      className={`w-full h-20 sm:h-24 md:h-32 flex flex-col items-center justify-center rounded-2xl gap-1 sm:gap-2 transition-all duration-300 hover:scale-110 ${
                        selectedTheme?.name === theme.name ? 'scale-110' : ''
                      }`}
                      style={{
                        border: '2px solid rgba(255, 255, 255, 0.3)',
                        backgroundColor: selectedTheme?.name === theme.name ? 
                          (theme.style.includes('purple') ? '#8e44ad' : 
                           theme.style.includes('yellow') ? '#f1c40f' :
                           theme.style.includes('blue') ? '#3498db' : '#2ecc71') : 'transparent',
                        color: selectedTheme?.name === theme.name ? '#0a0a0a' : '#E0E0E0'
                      }}
                    >
                      {theme.icon}
                      <span className="font-bold text-sm sm:text-base">{theme.name}</span>
                    </button>
                  ))}
                </div>
              </section>

              {/* Action & Output */}
              <section className="flex flex-col items-center gap-6">
                <button
                  onClick={handleGenerate}
                  disabled={!canGenerate() || isGenerating}
                  className="w-full max-w-sm h-14 sm:h-16 rounded-full flex items-center justify-center font-bold text-lg sm:text-xl transition-all duration-300 hover:scale-105"
                  style={{
                    backgroundColor: canGenerate() && !isGenerating ? '#ffffff' : 'rgba(96, 96, 96, 0.5)',
                    color: canGenerate() && !isGenerating ? '#000000' : '#a0a0a0',
                    cursor: canGenerate() && !isGenerating ? 'pointer' : 'not-allowed',
                    boxShadow: canGenerate() && !isGenerating ? '0 0 25px rgba(255,255,255,0.3)' : 'none',
                    opacity: canGenerate() && !isGenerating ? 1 : 0.5
                  }}
                >
                  {isGenerating ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Setting Up...</span>
                    </div>
                  ) : (
                    'Create Audio Mix'
                  )}
                </button>
                <div
                  className={`min-h-16 w-full max-w-2xl flex items-center justify-center text-center text-base sm:text-lg transition-all duration-500 px-4 ${
                    generatedPrompt ? 'opacity-100 scale-100' : 'opacity-0 scale-90'
                  }`}
                  style={{
                    color: generatedPrompt ? '#E0E0E0' : '#a0a0a0',
                    fontStyle: 'italic'
                  }}
                >
                  {generatedPrompt || 'Select a podcast and a theme to begin.'}
                </div>
              </section>
            </div>
          )}
        </div>

        {/* Modal for adding custom attributes - meditation mode only */}
        {selectedMode === 'meditation' && (
          <div 
            className={`fixed top-0 left-0 w-full h-full bg-black bg-opacity-70 z-50 flex justify-center items-center transition-opacity duration-300 ${
              showModal ? 'opacity-100 pointer-events-all' : 'opacity-0 pointer-events-none'
            }`}
            style={{
              backdropFilter: 'blur(10px)'
            }}
          >
            <div 
              className="bg-gray-800 p-6 rounded-2xl w-11/12 max-w-md text-center border border-gray-600 transition-transform duration-300"
              style={{
                backgroundColor: '#1a1a1a',
                transform: showModal ? 'scale(1)' : 'scale(0.9)'
              }}
            >
              <h2 className="text-lg sm:text-xl font-bold mb-4 text-white">Add a Custom Meditation Sound</h2>
              <input
                type="text"
                value={customSound}
                onChange={(e) => setCustomSound(e.target.value)}
                placeholder="e.g., 'Tibetan Flute'"
                className="w-full p-3 rounded-lg border border-gray-500 bg-gray-700 text-white mb-5 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                style={{
                  backgroundColor: '#222',
                  color: '#eee',
                  border: '1px solid #555'
                }}
                onKeyPress={(e) => e.key === 'Enter' && addCustomSound()}
              />
              <div className="flex space-x-3">
                <button
                  onClick={addCustomSound}
                  className="flex-1 p-3 rounded-lg bg-white text-black font-bold cursor-pointer transition-all duration-200 hover:scale-105 hover:bg-gray-100 text-sm sm:text-base"
                >
                  Add Sound
                </button>
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 p-3 rounded-lg bg-gray-600 text-white font-bold cursor-pointer transition-all duration-200 hover:scale-105 hover:bg-gray-500 text-sm sm:text-base"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Hidden Audio Element for meditation mode */}
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

        {/* CSS for custom slider styling */}
        <style jsx>{`
          .slider::-webkit-slider-thumb {
            appearance: none;
            height: 16px;
            width: 16px;
            border-radius: 50%;
            background: #ffffff;
            cursor: pointer;
            box-shadow: 0 0 8px rgba(255, 255, 255, 0.3);
          }
          
          .slider::-moz-range-thumb {
            height: 16px;
            width: 16px;
            border-radius: 50%;
            background: #ffffff;
            cursor: pointer;
            border: none;
            box-shadow: 0 0 8px rgba(255, 255, 255, 0.3);
          }
          
          .slider::-webkit-slider-track {
            height: 4px;
            cursor: pointer;
            background: #4a5568;
            border-radius: 2px;
          }
          
          .slider::-moz-range-track {
            height: 4px;
            cursor: pointer;
            background: #4a5568;
            border-radius: 2px;
            border: none;
          }
        `}</style>
      </div>
      </AppLayout>
    );
  }