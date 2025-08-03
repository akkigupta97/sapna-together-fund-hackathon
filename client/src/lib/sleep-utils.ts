// Calculate nightly persona based on profile and daily check-in
export function calculateNightlyPersona(
    biggestChallenge: string, // A, B, C, D
    stressLevel: string,      // low, medium, high
    thoughtsState: string     // calm, busy, racing
  ): string {
    let mindQuieter = 0;
    let stressMelter = 0;
    let deepSleeper = 0;
  
    // Permanent challenge points
    if (biggestChallenge === "A" || biggestChallenge === "C") {
      mindQuieter += 3;
    } else if (biggestChallenge === "B") {
      deepSleeper += 3;
    }
  
    // Daily stress points
    if (stressLevel === "medium") {
      stressMelter += 1;
    } else if (stressLevel === "high") {
      stressMelter += 3;
    }
  
    // Current thoughts points
    if (thoughtsState === "racing") {
      mindQuieter += 3;
    }
  
    // Determine persona
    if (stressMelter >= mindQuieter && stressMelter >= deepSleeper) {
      return "Stress Melter";
    }
    if (mindQuieter >= deepSleeper) {
      return "Mind Quieter";
    }
    return "Deep Sleeper";
  }
  
  // Get audio recipe based on chronotype and persona
  export function getAudioRecipe(chronotype: string, persona: string) {
    const baseRecipes = {
      "Stress Melter": [
        { type: "Guided Meditation", weight: 0.5 },
        { type: "Gentle Piano", weight: 0.3 },
        { type: "Rain on a Tent", weight: 0.2 }
      ],
      "Mind Quieter": [
        { type: "Sleep Story", weight: 0.6 },
        { type: "Forest Sounds", weight: 0.4 }
      ],
      "Deep Sleeper": [
        { type: "Pink Noise", weight: 0.5 },
        { type: "Binaural Beats", weight: 0.3 },
        { type: "Whale Songs", weight: 0.2 }
      ]
    };
  
    // Get base recipe
    const recipe = [...baseRecipes[persona as keyof typeof baseRecipes]];
    
    // Chronotype adjustments
    const chronoAdjustments: Record<string, any> = {
      Lion: [
        { type: "Morning Birds", weight: 0.1 }
      ],
      Bear: [
        { type: "Crickets", weight: 0.1 }
      ],
      Wolf: [
        { type: "Distant Thunder", weight: 0.1 }
      ],
      Dolphin: [
        { type: "Underwater", weight: 0.1 }
      ]
    };
  
    // Add chronotype-specific sounds
    if (chronoAdjustments[chronotype]) {
      recipe.push(...chronoAdjustments[chronotype]);
    }
  
    // Normalize weights
    const totalWeight = recipe.reduce((sum, track) => sum + track.weight, 0);
    return recipe.map(track => ({
      ...track,
      weight: track.weight / totalWeight
    }));
  }

  // ... existing code

export function getChronotypeDescription(type: string) {
    switch (type) {
      case "Lion":
        return {
          title: "The Lion",
          description: "Early risers who are most productive in the morning. Lions are natural leaders who prefer structure and routine.",
          emoji: "🦁",
          color: "from-amber-400 to-orange-500"
        };
      case "Bear":
        return {
          title: "The Bear",
          description: "Most people fall into this category. Bears follow the sun and have steady energy throughout the day.",
          emoji: "🐻",
          color: "from-green-400 to-emerald-500"
        };
      case "Wolf":
        return {
          title: "The Wolf",
          description: "Night owls who come alive in the evening. Wolves are creative and prefer working later in the day.",
          emoji: "🐺",
          color: "from-purple-400 to-indigo-500"
        };
      case "Dolphin":
        return {
          title: "The Dolphin",
          description: "Light sleepers who are often perfectionists. Dolphins are intelligent but may struggle with sleep quality.",
          emoji: "🐬",
          color: "from-blue-400 to-cyan-500"
        };
      default:
        return {
          title: "Unknown Type",
          description: "Unable to determine chronotype.",
          emoji: "❓",
          color: "from-gray-400 to-gray-600"
        };
    }
  }
  // src/lib/sleep-utils.ts

export function determineChronotype(answers: string[]): { type: string; scores: Record<string, number> } {
    if (answers.length !== 5) {
      throw new Error("Please provide exactly 5 answers.");
    }
  
    const scores: Record<string, number> = {
      Lion: 0,
      Bear: 0,
      Wolf: 0,
      Dolphin: 0
    };
  
    // Question 1: Natural Rhythm (Highest Weight)
    const q1 = answers[0];
    if (q1 === 'A') scores.Lion += 10;
    else if (q1 === 'B') scores.Bear += 10;
    else if (q1 === 'C') scores.Wolf += 10;
    else if (q1 === 'D') scores.Dolphin += 10;
  
    // Question 2: Sleep Quality (High Weight)
    const q2 = answers[1];
    if (q2 === 'A') scores.Bear += 5;
    else if (q2 === 'B') {
      scores.Bear += 3;
      scores.Lion += 2;
    }
    else if (q2 === 'C') {
      scores.Wolf += 3;
      scores.Dolphin += 3;
    }
    else if (q2 === 'D') scores.Dolphin += 5;
  
    // Question 3: Biggest Challenge (High Weight)
    const q3 = answers[2];
    if (q3 === 'A') scores.Wolf += 5;
    else if (q3 === 'B') scores.Dolphin += 5;
    else if (q3 === 'C') scores.Lion += 5;
    else if (q3 === 'D') {
      scores.Wolf += 1;
      scores.Dolphin += 1;
    }
  
    // Question 4: Personality (Medium Weight)
    const q4 = answers[3];
    if (q4 === 'A') {
      scores.Lion += 2;
      scores.Bear += 2;
    }
    else if (q4 === 'B') {
      scores.Dolphin += 3;
      scores.Wolf += 1;
    }
    else if (q4 === 'C') scores.Wolf += 2;
  
    // Question 5: Sound Preference (Low Weight)
    const q5 = answers[4];
    if (q5 === 'D') scores.Dolphin += 2;
  
    // Find the chronotype with the highest score
    let winner = "Bear"; // default
    let maxScore = 0;
    
    for (const [type, score] of Object.entries(scores)) {
      if (score > maxScore) {
        maxScore = score;
        winner = type;
      }
    }
  
    return { type: winner, scores };
  }