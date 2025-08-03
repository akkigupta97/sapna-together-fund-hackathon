import { useState } from "react";
import { Button } from "@/components/ui/button";
import { determineChronotype } from "@/lib/sleep-utils";

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

export default function ChronotypeQuestionnaire({ onComplete }: { onComplete: (result: any) => void }) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<string>("");
  const [result, setResult] = useState<{ type: string; scores: Record<string, number> } | null>(null);

  const handleAnswerSelect = (optionId: string) => {
    setSelectedAnswer(optionId);
  };

  const handleNext = () => {
    if (!selectedAnswer) return;

    const newAnswers = [...answers];
    newAnswers[currentQuestion] = selectedAnswer;
    setAnswers(newAnswers);

    if (currentQuestion === questions.length - 1) {
      const chronotypeResult = determineChronotype(newAnswers);
      localStorage.setItem("chronotype", JSON.stringify(chronotypeResult));
      setResult(chronotypeResult);
      onComplete(chronotypeResult);
    } else {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedAnswer("");
    }
  };

  const handleBack = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
      setSelectedAnswer(answers[currentQuestion - 1] || "");
    }
  };

  const handleComplete = () => {
    const chronotypeResult = determineChronotype(answers);
    // Save to localStorage or state
    localStorage.setItem("chronotype", JSON.stringify(chronotypeResult));
    onComplete(chronotypeResult);
  };

  const question = questions[currentQuestion];

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-white mb-2">{question.title}</h2>
        <p className="text-gray-300">{question.description}</p>
      </div>
      
      <div className="space-y-3 mb-8">
        {question.options.map((option) => (
          <div
            key={option.id}
            className={`p-4 rounded-lg cursor-pointer transition-all ${
              selectedAnswer === option.id
                ? "bg-purple-500/20 border border-purple-500"
                : "bg-white/5 border border-white/10 hover:bg-white/10"
            }`}
            onClick={() => handleAnswerSelect(option.id)}
          >
            <div className="font-medium text-white">{option.text}</div>
            {option.description && (
              <div className="text-sm text-gray-300 mt-1">{option.description}</div>
            )}
          </div>
        ))}
      </div>
      
      <div className="flex justify-between gap-4">
        <Button
          variant="outline"
          onClick={handleBack}
          className="text-white border-white/20 hover:bg-white/10"
          disabled={currentQuestion === 0}
        >
          Back
        </Button>
        
        <Button
          onClick={handleNext}
          disabled={!selectedAnswer}
          className="bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700"
        >
          {currentQuestion === questions.length - 1 ? "Complete" : "Next"}
        </Button>
      </div>
    </div>
  );
}
