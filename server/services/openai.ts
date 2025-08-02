import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || ""
});

export class SleepChatService {
  async generateResponse(userMessage: string, chatHistory: any[]): Promise<string> {
    if (!process.env.OPENAI_API_KEY && !process.env.OPENAI_API_KEY_ENV_VAR) {
      throw new Error("OpenAI API key not configured");
    }

    try {
      const systemPrompt = `You are Luna, an expert sleep wellness assistant. You provide personalized advice on:
      - Sleep hygiene and bedtime routines
      - Relaxation techniques and meditation
      - Managing sleep anxiety and stress
      - Creating optimal sleep environments
      - Understanding sleep cycles and patterns
      - Natural remedies for sleep issues
      
      Keep responses warm, supportive, and actionable. Limit responses to 2-3 sentences for mobile readability.
      Focus on evidence-based sleep science while being empathetic and encouraging.`;

      const messages = [
        { role: "system" as const, content: systemPrompt },
        ...chatHistory.slice(-10), // Keep last 10 messages for context
        { role: "user" as const, content: userMessage }
      ];

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages,
        max_tokens: 150,
        temperature: 0.7,
      });

      return response.choices[0].message.content || "I'm here to help with your sleep concerns. How can I assist you tonight?";
    } catch (error) {
      console.error("Error generating chat response:", error);
      throw new Error("Failed to generate response. Please try again.");
    }
  }

  async analyzeSleepData(sleepSessions: any[]): Promise<string> {
    if (!sleepSessions.length) {
      return "I don't have enough sleep data to provide insights yet. Start tracking your sleep to get personalized recommendations!";
    }

    try {
      const sleepData = sleepSessions.slice(0, 7).map(session => ({
        duration: session.duration,
        quality: session.quality,
        bedtime: session.startTime
      }));

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are a sleep data analyst. Analyze the sleep patterns and provide 2-3 actionable insights in a supportive tone."
          },
          {
            role: "user", 
            content: `Analyze this sleep data: ${JSON.stringify(sleepData)}`
          }
        ],
        max_tokens: 200,
        temperature: 0.5,
      });

      return response.choices[0].message.content || "Your sleep patterns look good! Keep maintaining consistent sleep habits.";
    } catch (error) {
      console.error("Error analyzing sleep data:", error);
      return "I'm having trouble analyzing your sleep data right now. Try asking me specific questions about your sleep!";
    }
  }
}

export const sleepChatService = new SleepChatService();
