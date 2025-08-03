import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import AppLayout from "@/components/layout/app-layout";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Bot, User, Send, Lightbulb, Heart } from "lucide-react";
import { format } from "date-fns";
import type { ChatMessage } from "@shared/schema";

export default function Chat() {
  const [message, setMessage] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const userId = localStorage.getItem("currentUserId") || "demo-user-123";

  const { data: messages = [], isLoading, error } = useQuery<ChatMessage[]>({
    queryKey: ["/api/chat", userId],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/chat?userId=${userId}`);
      const data = response instanceof Response ? await response.json() : response;
      return data as ChatMessage[];
    },
    refetchInterval: 1000,
    enabled: !!userId,
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      const response = await apiRequest("POST", "/api/chat", { userId, content });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/chat", userId] });
      setMessage("");
    },
    onError: (error: any) => {
      console.error("Failed to send message:", error);
      toast({
        title: "Failed to send message",
        description: "Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    sendMessageMutation.mutate(message.trim());
  };

  const quickActions = [
    { icon: Lightbulb, text: "Sleep tips", message: "Can you give me some sleep tips?" },
    { icon: Heart, text: "Relaxation techniques", message: "What relaxation techniques can help me sleep better?" },
  ];

  const handleQuickAction = (actionMessage: string) => {
    sendMessageMutation.mutate(actionMessage);
  };

  // Debug logging
  console.log("Messages:", messages);
  console.log("Messages length:", messages?.length);
  console.log("Query loading:", isLoading);
  console.log("Query error:", error);

  return (
    <AppLayout>
      <div className="p-3 sm:p-4 md:p-6">
        <Card className="glass-card p-3 sm:p-4">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-mint-green to-blue-400 rounded-full flex items-center justify-center">
              <Bot className="text-white w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <div className="font-semibold text-sm sm:text-base">Luna Sleep Assistant</div>
              <div className="text-xs sm:text-sm text-mint-green">Online • Sleep Expert</div>
            </div>
          </div>
        </Card>
      </div>

      <div className="flex-1 px-3 sm:px-4 md:px-6 pb-32 sm:pb-32 md:pb-24">
        <div className="space-y-3 sm:space-y-4 mb-4 sm:mb-6">
          {isLoading ? (
            <Card className="glass-card p-4 sm:p-6 text-center">
              <div className="w-6 h-6 sm:w-8 sm:h-8 border-2 border-mint-green border-t-transparent rounded-full animate-spin mx-auto mb-3 sm:mb-4" />
              <p className="text-sm sm:text-base text-gray-300">Loading messages...</p>
            </Card>
          ) : error ? (
            <Card className="glass-card p-4 sm:p-6 text-center">
              <p className="text-sm sm:text-base text-red-400">Error loading messages: {error.message}</p>
            </Card>
          ) : messages.length === 0 ? (
            <Card className="glass-card p-4 sm:p-6 text-center">
              <Bot className="w-10 h-10 sm:w-12 sm:h-12 text-mint-green mx-auto mb-3 sm:mb-4" />
              <h3 className="text-base sm:text-lg font-semibold mb-2">Welcome to Luna!</h3>
              <p className="text-sm sm:text-base text-gray-300 mb-4">
                I'm your personal sleep assistant. I can help you with sleep tips, 
                relaxation techniques, and answer any questions about your sleep wellness.
              </p>
              <div className="grid grid-cols-1 gap-2 sm:gap-3">
                {quickActions.map((action, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    onClick={() => handleQuickAction(action.message)}
                    className="glass-button text-left justify-start space-x-2 text-sm sm:text-base py-2 sm:py-3"
                  >
                    <action.icon className="w-4 h-4" />
                    <span>{action.text}</span>
                  </Button>
                ))}
              </div>
            </Card>
          ) : (
            <div className="space-y-3 sm:space-y-4 max-h-[60vh] sm:max-h-96 overflow-y-auto">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex space-x-2 sm:space-x-3 ${
                    msg.role === "user" ? "justify-end" : ""
                  }`}
                >
                  {msg.role === "assistant" && (
                    <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-r from-mint-green to-blue-400 rounded-full flex items-center justify-center flex-shrink-0">
                      <Bot className="text-white text-xs sm:text-sm" />
                    </div>
                  )}
                  <div
                    className={`max-w-[280px] sm:max-w-xs p-3 sm:p-4 rounded-2xl ${
                      msg.role === "user"
                        ? "gradient-purple rounded-tr-sm"
                        : "glass-card rounded-tl-sm"
                    }`}
                  >
                    <p className="text-xs sm:text-sm leading-relaxed">{msg.content}</p>
                    <div className="text-xs text-gray-400 mt-2">
                      {msg.timestamp ? format(new Date(msg.timestamp), "h:mm a") : ""}
                    </div>
                  </div>
                  {msg.role === "user" && (
                    <div className="w-6 h-6 sm:w-8 sm:h-8 bg-warm-amber rounded-full flex items-center justify-center flex-shrink-0">
                      <User className="text-white text-xs sm:text-sm" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions - Show only when there are messages, mobile responsive */}
        {messages.length > 0 && (
          <div className="mt-3 sm:mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
            {quickActions.map((action, index) => (
              <Button
                key={index}
                variant="outline"
                onClick={() => handleQuickAction(action.message)}
                className="glass-button text-xs sm:text-sm py-2 sm:py-3"
                disabled={sendMessageMutation.isPending}
              >
                <action.icon className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                {action.text}
              </Button>
            ))}
          </div>
        )}
      </div>

      {/* Chat Input - Fixed at bottom, mobile optimized */}
      <div className="fixed bottom-16 sm:bottom-16 md:bottom-4 left-0 right-0 p-3 sm:p-4 bg-gradient-to-t from-[hsl(250,69%,26%)] to-transparent">
        <Card className="glass-card p-3 sm:p-4">
          <form onSubmit={handleSendMessage} className="flex space-x-2 sm:space-x-3">
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Ask Luna about sleep..."
              className="flex-1 glass-button border-white/20 focus:border-soft-indigo text-white placeholder-gray-400 text-sm sm:text-base py-2 sm:py-3"
              disabled={sendMessageMutation.isPending}
            />
            <Button
              type="submit"
              disabled={!message.trim() || sendMessageMutation.isPending}
              className="gradient-purple rounded-xl hover:scale-105 transition-transform duration-300 p-2 sm:p-3"
            >
              {sendMessageMutation.isPending ? (
                <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Send className="text-white w-4 h-4 sm:w-5 sm:h-5" />
              )}
            </Button>
          </form>
        </Card>
      </div>
    </AppLayout>
  );
}
