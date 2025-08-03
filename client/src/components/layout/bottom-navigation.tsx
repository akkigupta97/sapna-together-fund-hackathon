import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { Home, TrendingUp, MessageCircle, User, Headphones } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

const navigationItems = [
  { path: "/", icon: Home, label: "Home" },
  { path: "/podcast-meditation", icon: Headphones, label: "Voices" },
  { path: "/chat", icon: MessageCircle, label: "Chat" },
  { path: "/profile", icon: User, label: "Profile" },
];

export default function BottomNavigation() {
  const [location, setLocation] = useLocation();
  const isMobile = useIsMobile();

  const isActive = (path: string) => {
    if (path === "/") {
      return location === "/";
    }
    return location.startsWith(path);
  };

  // Only show bottom navigation on mobile
  if (!isMobile) {
    return null;
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/10 backdrop-blur-md border-t border-white/20 safe-area-bottom">
      <div className="flex justify-around py-2 px-2">
        {navigationItems.map((item) => (
          <Button
            key={item.path}
            variant="ghost"
            onClick={() => setLocation(item.path)}
            className={`flex flex-col items-center p-3 space-y-1 hover:bg-white/10 rounded-xl transition-colors duration-300 min-w-0 flex-1 ${
              isActive(item.path) ? "text-soft-indigo" : "text-white"
            }`}
          >
            <item.icon className="w-5 h-5" />
            <span className="text-xs font-medium">{item.label}</span>
          </Button>
        ))}
      </div>
    </nav>
  );
}
