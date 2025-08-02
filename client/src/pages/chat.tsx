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

  const { data: messages = [] } = useQuery<ChatMessage[]>({
    queryKey: ["/api/chat", userId],
  });

  const sendMessageMutation = useMutation({
    mutationFn: (content: string) =>
      apiRequest("POST", "/api/chat", { userId, content }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/chat", userId] });
      setMessage("");
    },
    onError: () => {
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

  return (
    <AppLayout>
      {/* Header */}
      <div className="p-4 md:p-6">
        <Card className="glass-card p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-mint-green to-blue-400 rounded-full flex items-center justify-center">
              <Bot className="text-white" />
            </div>
            <div>
              <div className="font-semibold">Luna Sleep Assistant</div>
              <div className="text-sm text-mint-green">Online • Sleep Expert</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 px-4 md:px-6 pb-32 md:pb-24">
        <div className="space-y-4 mb-6">
          {messages.length === 0 ? (
            <Card className="glass-card p-6 text-center">
              <Bot className="w-12 h-12 text-mint-green mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Welcome to Luna!</h3>
              <p className="text-gray-300 mb-4">
                I'm your personal sleep assistant. I can help you with sleep tips, 
                relaxation techniques, and answer any questions about your sleep wellness.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {quickActions.map((action, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    onClick={() => handleQuickAction(action.message)}
                    className="glass-button text-left justify-start space-x-2"
                  >
                    <action.icon className="w-4 h-4" />
                    <span>{action.text}</span>
                  </Button>
                ))}
              </div>
            </Card>
          ) : (
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex space-x-3 ${
                    msg.role === "user" ? "justify-end" : ""
                  }`}
                >
                  {msg.role === "assistant" && (
                    <div className="w-8 h-8 bg-gradient-to-r from-mint-green to-blue-400 rounded-full flex items-center justify-center flex-shrink-0">
                      <Bot className="text-white text-xs" />
                    </div>
                  )}
                  <div
                    className={`max-w-xs p-4 rounded-2xl ${
                      msg.role === "user"
                        ? "gradient-purple rounded-tr-sm"
                        : "glass-card rounded-tl-sm"
                    }`}
                  >
                    <p className="text-sm">{msg.content}</p>
                    <div className="text-xs text-gray-400 mt-2">
                      {format(new Date(msg.timestamp!), "h:mm a")}
                    </div>
                  </div>
                  {msg.role === "user" && (
                    <div className="w-8 h-8 bg-warm-amber rounded-full flex items-center justify-center flex-shrink-0">
                      <User className="text-white text-xs" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions - Show only when no messages */}
        {messages.length > 0 && (
          <div className="mt-4 grid grid-cols-2 gap-3">
            {quickActions.map((action, index) => (
              <Button
                key={index}
                variant="outline"
                onClick={() => handleQuickAction(action.message)}
                className="glass-button text-sm"
                disabled={sendMessageMutation.isPending}
              >
                <action.icon className="w-4 h-4 mr-1" />
                {action.text}
              </Button>
            ))}
          </div>
        )}
      </div>

      {/* Chat Input - Fixed at bottom */}
      <div className="fixed bottom-16 md:bottom-4 left-0 right-0 p-4 bg-gradient-to-t from-[hsl(250,69%,26%)] to-transparent">
        <Card className="glass-card p-4">
          <form onSubmit={handleSendMessage} className="flex space-x-3">
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Ask Luna about sleep..."
              className="flex-1 glass-button border-white/20 focus:border-soft-indigo text-white placeholder-gray-400"
              disabled={sendMessageMutation.isPending}
            />
            <Button
              type="submit"
              disabled={!message.trim() || sendMessageMutation.isPending}
              className="gradient-purple rounded-xl hover:scale-105 transition-transform duration-300"
            >
              {sendMessageMutation.isPending ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Send className="text-white" />
              )}
            </Button>
          </form>
        </Card>
      </div>
    </AppLayout>
  );
}
