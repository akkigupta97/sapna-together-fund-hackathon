import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { Home, Headphones, MessageCircle, User, Settings, Moon } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

const navigationItems = [
  { path: "/", icon: Home, label: "Home" },
  { path: "/podcast-meditation", icon: Headphones, label: "Voices" },
  { path: "/chat", icon: MessageCircle, label: "Chat" },
  { path: "/profile", icon: User, label: "Profile" },
];

export default function TopNavigation() {
  const [location, setLocation] = useLocation();
  const isMobile = useIsMobile();

  const isActive = (path: string) => {
    if (path === "/") {
      return location === "/";
    }
    return location.startsWith(path);
  };

  // Only show top navigation on desktop
  if (isMobile) {
    return null;
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/10 backdrop-blur-md border-b border-white/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 gradient-purple rounded-full flex items-center justify-center">
              <img src="https://sapna-assets.s3.us-east-1.amazonaws.com/sapna.png" className="text-white h-8 w-8 text-sm rounded-md" />
            </div>
            <h1 className="text-lg font-semibold text-white">Sapna</h1>
          </div>

          {/* Navigation Links */}
          <div className="flex items-center space-x-1">
            {navigationItems.map((item) => (
              <Button
                key={item.path}
                variant="ghost"
                onClick={() => setLocation(item.path)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-colors duration-300 ${
                  isActive(item.path) 
                    ? "text-soft-indigo bg-white/20" 
                    : "text-white hover:bg-white/10"
                }`}
              >
                <item.icon className="w-4 h-4" />
                <span className="font-medium">{item.label}</span>
              </Button>
            ))}
          </div>

          {/* Settings */}
          {/* <Button variant="ghost" size="icon" className="rounded-full hover:bg-white/10">
            <Settings className="text-white w-5 h-5" />
          </Button> */}
        </div>
      </div>
    </nav>
  );
}