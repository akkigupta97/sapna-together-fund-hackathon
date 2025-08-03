import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useLocation } from "wouter";
import { ArrowLeft, ArrowRight, CheckCircle, Sparkles, Sun, Moon, Sunset, Waves } from "lucide-react";

interface QuestionOption {
  id: string;
  text: string;
  description?: string;
}

interface Question {
  id: number;
  title: string;
  description: string;
  options: QuestionOption[];
}

const questions: Question[] = [
  {
    id: 1,
    title: "What's Your Natural Rhythm?",
    description: "Which of these sounds most like your natural rhythm, especially on days off?",
    options: [
      { id: "A", text: "I'm an early bird, most alert in the morning.", description: "Morning person" },
      { id: "B", text: "My energy follows the sun; up in the morning, tired after sunset.", description: "Balanced rhythm" },
      { id: "C", text: "I'm a night owl, hitting my stride in the evening.", description: "Evening person" },
      { id: "D", text: "I'm a very light sleeper; my schedule is often unpredictable.", description: "Irregular schedule" }
    ]
  },
  {
    id: 2,
    title: "Sleep Quality Assessment",
    description: "Over the past month, how would you rate your sleep quality overall?",
    options: [
      { id: "A", text: "Very Good", description: "Consistently restful sleep" },
      { id: "B", text: "Fairly Good", description: "Generally satisfactory" },
      { id: "C", text: "Fairly Bad", description: "Often disrupted" },
      { id: "D", text: "Very Bad", description: "Consistently poor" }
    ]
  },
  {
    id: 3,
    title: "Primary Sleep Challenge",
    description: "What is your single biggest challenge with sleep?",
    options: [
      { id: "A", text: "Difficulty falling asleep", description: "Takes a long time to drift off" },
      { id: "B", text: "Waking up frequently during the night", description: "Interrupted sleep" },
      { id: "C", text: "Waking up too early and being unable to get back to sleep", description: "Early morning awakening" },
      { id: "D", text: "Feeling tired even after a full night's sleep", description: "Non-restorative sleep" }
    ]
  },
  {
    id: 4,
    title: "Challenge Response Style",
    description: "When facing a new challenge, you are more likely to...",
    options: [
      { id: "A", text: "Plan carefully and stick to the plan", description: "Structured approach" },
      { id: "B", text: "Worry about what might go wrong", description: "Cautious mindset" },
      { id: "C", text: "Jump in and figure it out as I go", description: "Adaptive approach" },
      { id: "D", text: "Research thoroughly before acting", description: "Analytical approach" }
    ]
  },
  {
    id: 5,
    title: "Relaxation Preferences",
    description: "Which type of sound do you generally find most relaxing?",
    options: [
      { id: "A", text: "A person speaking calmly", description: "Guided meditation or stories" },
      { id: "B", text: "Musical sounds", description: "Like gentle piano" },
      { id: "C", text: "Nature sounds", description: "Forest or ocean waves" },
      { id: "D", text: "Simple background noise", description: "Rain or fan sounds" }
    ]
  }
];

// Chronotype determination algorithm
function determineChronotype(answers: string[]): { type: string; scores: Record<string, number> } {
  if (answers.length !== 5) {
    throw new Error("Please provide exactly 5 answers.");
  }

  const scores = { Lion: 0, Bear: 0, Wolf: 0, Dolphin: 0 };

  // Question 1: Natural Rhythm (Highest Weight)
  const q1 = answers[0];
  if (q1 === 'A') scores.Lion += 10;
  else if (q1 === 'B') scores.Bear += 10;
  else if (q1 === 'C') scores.Wolf += 10;
  else if (q1 === 'D') scores.Dolphin += 10;

  // Question 2: Sleep Quality (High Weight)
  const q2 = answers[1];
  if (q2 === 'A') scores.Bear += 5;
  else if (q2 === 'B') { scores.Bear += 3; scores.Lion += 2; }
  else if (q2 === 'C') { scores.Wolf += 3; scores.Dolphin += 3; }
  else if (q2 === 'D') scores.Dolphin += 5;

  // Question 3: Biggest Challenge (High Weight)
  const q3 = answers[2];
  if (q3 === 'A') scores.Wolf += 5;
  else if (q3 === 'B') scores.Dolphin += 5;
  else if (q3 === 'C') scores.Lion += 5;
  else if (q3 === 'D') { scores.Wolf += 1; scores.Dolphin += 1; }

  // Question 4: Personality (Medium Weight)
  const q4 = answers[3];
  if (q4 === 'A') { scores.Lion += 2; scores.Bear += 2; }
  else if (q4 === 'B') { scores.Dolphin += 3; scores.Wolf += 1; }
  else if (q4 === 'C') scores.Wolf += 2;

  // Question 5: Sound Preference (Low Weight)
  const q5 = answers[4];
  if (q5 === 'D') scores.Dolphin += 2;

  const winner = Object.keys(scores).reduce((a, b) => scores[a as keyof typeof scores] > scores[b as keyof typeof scores] ? a : b);
  return { type: winner, scores };
}

export default function Questionnaire() {
  const [, setLocation] = useLocation();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<string>("");
  const [isComplete, setIsComplete] = useState(false);
  const [result, setResult] = useState<{ type: string; scores: Record<string, number> } | null>(null);

  const progress = ((currentQuestion + 1) / questions.length) * 100;

  const handleAnswerSelect = (optionId: string) => {
    setSelectedAnswer(optionId);
  };

  const handleNext = () => {
    if (!selectedAnswer) return;

    const newAnswers = [...answers];
    newAnswers[currentQuestion] = selectedAnswer;
    setAnswers(newAnswers);

    if (currentQuestion === questions.length - 1) {
      // Complete questionnaire and determine chronotype
      const chronotypeResult = determineChronotype([...newAnswers]);
      setResult(chronotypeResult);
      setIsComplete(true);
    } else {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedAnswer("");
    }
  };

  const handleBack = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
      setSelectedAnswer(answers[currentQuestion - 1] || "");
    } else {
      setLocation("/");
    }
  };

  const handleRestart = () => {
    setCurrentQuestion(0);
    setAnswers([]);
    setSelectedAnswer("");
    setIsComplete(false);
    setResult(null);
  };

  const getChronotypeDescription = (type: string) => {
    switch (type) {
      case "Lion":
        return {
          title: "The Lion",
          description: "Early risers who are most productive in the morning. Lions are natural leaders who prefer structure and routine.",
          traits: ["Morning person", "Natural leader", "Structured", "High energy early"],
          color: "from-amber-400 to-orange-500",
          bgColor: "bg-gradient-to-br from-amber-50 to-orange-100",
          textColor: "text-amber-900",
          icon: Sun,
          schedule: "5:30 AM - 9:30 PM",
          peakHours: "6:00 AM - 12:00 PM"
        };
      case "Bear":
        return {
          title: "The Bear",
          description: "Most people fall into this category. Bears follow the sun and have steady energy throughout the day.",
          traits: ["Balanced rhythm", "Steady energy", "Social", "Good sleepers"],
          color: "from-green-400 to-emerald-500",
          bgColor: "bg-gradient-to-br from-green-50 to-emerald-100",
          textColor: "text-green-900",
          icon: Sunset,
          schedule: "7:00 AM - 11:00 PM",
          peakHours: "10:00 AM - 2:00 PM"
        };
      case "Wolf":
        return {
          title: "The Wolf",
          description: "Night owls who come alive in the evening. Wolves are creative and prefer working later in the day.",
          traits: ["Night owl", "Creative", "Independent", "Peak energy evening"],
          color: "from-purple-400 to-indigo-500",
          bgColor: "bg-gradient-to-br from-purple-50 to-indigo-100",
          textColor: "text-purple-900",
          icon: Moon,
          schedule: "7:30 AM - 12:00 AM",
          peakHours: "5:00 PM - 9:00 PM"
        };
      case "Dolphin":
        return {
          title: "The Dolphin",
          description: "Light sleepers who are often perfectionists. Dolphins are intelligent but may struggle with sleep quality.",
          traits: ["Light sleeper", "Perfectionist", "Intelligent", "Cautious"],
          color: "from-blue-400 to-cyan-500",
          bgColor: "bg-gradient-to-br from-blue-50 to-cyan-100",
          textColor: "text-blue-900",
          icon: Waves,
          schedule: "6:30 AM - 11:30 PM",
          peakHours: "10:00 AM - 2:00 PM"
        };
      default:
        return {
          title: "Unknown Type",
          description: "Unable to determine chronotype.",
          traits: [],
          color: "from-gray-400 to-gray-600",
          bgColor: "bg-gray-100",
          textColor: "text-gray-900",
          icon: Sparkles,
          schedule: "Unknown",
          peakHours: "Unknown"
        };
    }
  };

  if (isComplete && result) {
    const chronotype = getChronotypeDescription(result.type);
    const IconComponent = chronotype.icon;
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4 md:p-6 flex items-center justify-center">
        <div className="max-w-4xl mx-auto w-full">
          <Card className={`${chronotype.bgColor} border-0 shadow-2xl overflow-hidden`}>
            {/* Header Section */}
            <div className={`bg-gradient-to-r ${chronotype.color} p-6 md:p-8 text-center`}>
              <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-4">
                <IconComponent className="w-10 h-10 md:w-12 md:h-12 text-white" />
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">{chronotype.title}</h1>
              <p className="text-white/90 text-lg md:text-xl">{chronotype.description}</p>
            </div>

            {/* Content Section */}
            <div className="p-6 md:p-8">
              {/* Key Traits */}
              <div className="mb-8">
                <h3 className={`text-xl font-semibold mb-4 ${chronotype.textColor}`}>Your Key Traits</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {chronotype.traits.map((trait, index) => (
                    <Badge 
                      key={index} 
                      className={`bg-gradient-to-r ${chronotype.color} text-white border-0 py-2 px-4 text-sm justify-center`}
                    >
                      {trait}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Schedule Information */}
              <div className="grid md:grid-cols-2 gap-6 mb-8">
                <div className={`p-4 rounded-lg bg-white/50 border-l-4 border-gradient-to-b ${chronotype.color.replace('from-', 'border-').split(' ')[0]}`}>
                  <h4 className={`font-semibold mb-2 ${chronotype.textColor}`}>Optimal Sleep Schedule</h4>
                  <p className={`${chronotype.textColor.replace('900', '700')}`}>{chronotype.schedule}</p>
                </div>
                <div className={`p-4 rounded-lg bg-white/50 border-l-4 border-gradient-to-b ${chronotype.color.replace('to-', 'border-').split(' ')[1]}`}>
                  <h4 className={`font-semibold mb-2 ${chronotype.textColor}`}>Peak Performance Hours</h4>
                  <p className={`${chronotype.textColor.replace('900', '700')}`}>{chronotype.peakHours}</p>
                </div>
              </div>

              {/* Scores Breakdown */}
              <div className="mb-8">
                <h3 className={`text-xl font-semibold mb-4 ${chronotype.textColor}`}>Your Chronotype Scores</h3>
                <div className="space-y-4">
                  {Object.entries(result.scores)
                    .sort(([,a], [,b]) => b - a)
                    .map(([type, score]) => {
                      const typeInfo = getChronotypeDescription(type);
                      const TypeIcon = typeInfo.icon;
                      const maxScore = Math.max(...Object.values(result.scores));
                      const percentage = (score / maxScore) * 100;
                      
                      return (
                        <div key={type} className="flex items-center space-x-4">
                          <div className={`w-10 h-10 rounded-full bg-gradient-to-r ${typeInfo.color} flex items-center justify-center flex-shrink-0`}>
                            <TypeIcon className="w-5 h-5 text-white" />
                          </div>
                          <div className="flex-1">
                            <div className="flex justify-between items-center mb-1">
                              <span className={`font-medium ${chronotype.textColor}`}>{type}</span>
                              <span className={`font-bold ${chronotype.textColor}`}>{score}</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                              <div 
                                className={`h-full bg-gradient-to-r ${typeInfo.color} transition-all duration-1000 ease-out`}
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-4">
                <Button
                  onClick={() => setLocation("/video-experience")}
                  className={`w-full bg-gradient-to-r ${chronotype.color} hover:opacity-90 text-white py-4 text-lg h-auto shadow-lg`}
                >
                  <Sparkles className="mr-2 w-5 h-5" />
                  Listen To Your Personalized Audio
                </Button>
                
                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
                  <Button
                    onClick={handleRestart}
                    variant="outline"
                    className={`flex-1 border-2 ${chronotype.color.replace('from-', 'border-').split(' ')[0]} ${chronotype.textColor} hover:bg-white/50`}
                  >
                    Retake Quiz
                  </Button>
                  <Button
                    onClick={() => setLocation("/")}
                    variant="outline"
                    className={`flex-1 border-2 ${chronotype.color.replace('to-', 'border-').split(' ')[1]} ${chronotype.textColor} hover:bg-white/50`}
                  >
                    Back to Home
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  const question = questions[currentQuestion];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4 md:p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <div className="flex items-center justify-between mb-4">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleBack} 
              className="h-10 w-10 text-white hover:bg-white/10"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="text-sm text-gray-300">
              {currentQuestion + 1} of {questions.length}
            </div>
          </div>
          
          <Progress 
            value={progress} 
            className="mb-6 h-3 bg-gray-700"
          />
          
          <div className="text-center">
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-gradient-to-r from-purple-500 to-indigo-600 flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-8 h-8 md:w-10 md:h-10 text-white" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-3">
              {question.title}
            </h1>
            <p className="text-gray-300 text-base md:text-lg">
              {question.description}
            </p>
          </div>
        </div>

        {/* Question Options */}
        <Card className="bg-white/10 backdrop-blur-md border-white/20 p-6 mb-8">
          <div className="space-y-4">
            {question.options.map((option) => (
              <Card
                key={option.id}
                className={`bg-white/5 backdrop-blur-sm border-white/10 p-4 cursor-pointer transition-all duration-300 hover:bg-white/15 active:scale-[0.98] ${
                  selectedAnswer === option.id ? "ring-2 ring-purple-400 bg-white/20" : ""
                }`}
                onClick={() => handleAnswerSelect(option.id)}
              >
                <div className="flex items-start space-x-4">
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-1 transition-all duration-200 ${
                    selectedAnswer === option.id 
                      ? "bg-purple-500 border-purple-500" 
                      : "border-gray-400 hover:border-purple-400"
                  }`}>
                    {selectedAnswer === option.id && (
                      <CheckCircle className="w-4 h-4 text-white" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-white mb-1 text-base">
                      {option.text}
                    </div>
                    {option.description && (
                      <div className="text-sm text-gray-400">
                        {option.description}
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between gap-4">
          <Button
            variant="outline"
            onClick={handleBack}
            className="border-white/20 text-white hover:bg-white/10 flex-1 sm:flex-none"
            disabled={currentQuestion === 0}
          >
            <ArrowLeft className="mr-2 w-4 h-4" />
            {currentQuestion === 0 ? "Home" : "Back"}
          </Button>
          
          <Button
            onClick={handleNext}
            disabled={!selectedAnswer}
            className="bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white flex-1 sm:flex-none disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {currentQuestion === questions.length - 1 ? (
              <>
                <CheckCircle className="mr-2 w-4 h-4" />
                Complete
              </>
            ) : (
              <>
                Next
                <ArrowRight className="ml-2 w-4 h-4" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}