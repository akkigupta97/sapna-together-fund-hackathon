import type { SleepProfile, SleepSession } from "@shared/schema";

export interface AudioGenerationParams {
  category: string;
  intensity: "low" | "medium" | "high";
  duration: number; // minutes
  environmentalFactors: string[];
  personalizedElements: string[];
}

export function generateAudioParameters(
  profile: SleepProfile,
  recentSessions: SleepSession[] = [],
  timeOfDay: "evening" | "night" | "morning" = "evening"
): AudioGenerationParams {
  
  // Analyze recent sleep quality
  const avgQuality = recentSessions.length > 0
    ? recentSessions.reduce((sum, s) => sum + (s.quality || 0), 0) / recentSessions.length
    : 75; // Default assumption

  // Determine primary category based on preferences and recent performance
  let category = profile.soundPreferences?.[0] || "nature";
  
  // If recent sleep quality is poor, prioritize more effective categories
  if (avgQuality < 60) {
    if (profile.soundPreferences?.includes("white_noise")) {
      category = "white_noise"; // Most consistent for poor sleepers
    } else if (profile.soundPreferences?.includes("nature")) {
      category = "nature"; // Second most effective
    }
  }

  // Determine intensity based on stress level and sleep issues
  let intensity: "low" | "medium" | "high" = "medium";
  
  if (profile.stressLevel >= 8 || profile.sleepIssues?.includes("stress_anxiety")) {
    intensity = "low"; // Gentler sounds for high stress
  } else if (profile.stressLevel <= 3 && avgQuality >= 80) {
    intensity = "high"; // More complex sounds for good sleepers
  }

  // Adjust for time of day
  if (timeOfDay === "morning") {
    intensity = "high"; // More energizing
    category = "nature"; // Birds, water sounds
  } else if (timeOfDay === "night") {
    intensity = "low"; // Very gentle for deep sleep
  }

  // Duration based on preferred sleep duration
  const baseDuration = Math.floor((profile.preferredDuration || 480) / 60); // Convert to hours
  const duration = Math.max(30, Math.min(180, baseDuration * 60)); // 30min to 3hrs

  // Environmental factors
  const environmentalFactors: string[] = [];
  if (profile.sleepEnvironment === "city") {
    environmentalFactors.push("noise_masking", "consistent_volume");
  } else if (profile.sleepEnvironment === "quiet") {
    environmentalFactors.push("very_gentle", "low_volume");
  } else if (profile.sleepEnvironment === "rural") {
    environmentalFactors.push("natural_variance", "organic_sounds");
  }

  // Personalized elements based on sleep issues
  const personalizedElements: string[] = [];
  
  if (profile.sleepIssues?.includes("trouble_falling_asleep")) {
    personalizedElements.push("progressive_relaxation", "slowing_tempo");
  }
  
  if (profile.sleepIssues?.includes("frequent_waking")) {
    personalizedElements.push("continuous_loop", "stable_frequencies");
  }
  
  if (profile.sleepIssues?.includes("restless_sleep")) {
    personalizedElements.push("deep_bass_tones", "grounding_sounds");
  }

  if (profile.sleepIssues?.includes("stress_anxiety")) {
    personalizedElements.push("breathing_rhythm", "heart_rate_sync");
  }

  // Add bedtime routine factors
  const bedtimeHour = parseInt(profile.bedtime?.split(":")[0] || "22");
  if (bedtimeHour <= 21) {
    personalizedElements.push("early_sleeper_optimized");
  } else if (bedtimeHour >= 24) {
    personalizedElements.push("night_owl_optimized");
  }

  return {
    category,
    intensity,
    duration,
    environmentalFactors,
    personalizedElements
  };
}

export function generateSleepPrompt(params: AudioGenerationParams): string {
  const { category, intensity, duration, environmentalFactors, personalizedElements } = params;

  const basePrompts = {
    nature: {
      low: "Gentle rainfall on leaves with soft wind through trees",
      medium: "Flowing stream with distant bird calls and rustling foliage", 
      high: "Ocean waves with seagulls and coastal wind patterns"
    },
    white_noise: {
      low: "Soft, consistent white noise with minimal variation",
      medium: "Balanced pink noise with gentle frequency modulation",
      high: "Rich brown noise with harmonic overtones"
    },
    asmr: {
      low: "Whispered affirmations with gentle breathing sounds",
      medium: "Soft tapping and brushing with caring whispers",
      high: "Detailed tactile sounds with immersive 3D audio"
    },
    ambient: {
      low: "Ethereal drones with slowly evolving harmonics",
      medium: "Spacious soundscapes with celestial tones",
      high: "Complex atmospheric textures with deep resonance"
    }
  };

  let prompt = basePrompts[category as keyof typeof basePrompts][intensity];

  // Add environmental modifications
  if (environmentalFactors.includes("noise_masking")) {
    prompt += ", designed to mask urban noise and distractions";
  }
  if (environmentalFactors.includes("very_gentle")) {
    prompt += ", extremely gentle and unobtrusive";
  }
  if (environmentalFactors.includes("natural_variance")) {
    prompt += ", with natural organic variations and subtle changes";
  }

  // Add personalized elements
  if (personalizedElements.includes("progressive_relaxation")) {
    prompt += ", gradually slowing and becoming more peaceful over time";
  }
  if (personalizedElements.includes("continuous_loop")) {
    prompt += ", seamlessly looping without jarring transitions";
  }
  if (personalizedElements.includes("breathing_rhythm")) {
    prompt += ", synchronized with natural breathing patterns for relaxation";
  }
  if (personalizedElements.includes("deep_bass_tones")) {
    prompt += ", featuring grounding low-frequency elements";
  }

  prompt += `. Duration: ${duration} minutes. Optimized for deep, restorative sleep.`;

  return prompt;
}

export function calculateSleepScore(session: SleepSession, profile: SleepProfile): number {
  let score = 0;
  const weights = {
    duration: 0.3,
    quality: 0.4,
    timing: 0.2,
    consistency: 0.1
  };

  // Duration score (0-100)
  if (session.duration && profile.preferredDuration) {
    const durationRatio = session.duration / profile.preferredDuration;
    const durationScore = Math.max(0, 100 - Math.abs(durationRatio - 1) * 100);
    score += durationScore * weights.duration;
  }

  // Quality score (directly from session)
  if (session.quality) {
    score += session.quality * weights.quality;
  }

  // Timing score based on preferred bedtime
  if (session.startTime && profile.bedtime) {
    const sessionHour = new Date(session.startTime).getHours();
    const preferredHour = parseInt(profile.bedtime.split(":")[0]);
    const timingDiff = Math.abs(sessionHour - preferredHour);
    const timingScore = Math.max(0, 100 - timingDiff * 10);
    score += timingScore * weights.timing;
  }

  // Consistency bonus (placeholder - would need multiple sessions)
  score += 75 * weights.consistency; // Default consistency score

  return Math.round(Math.max(0, Math.min(100, score)));
}
