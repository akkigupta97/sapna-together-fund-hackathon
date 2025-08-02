import { ReactNode } from "react";
import TopNavigation from "./top-navigation";
import BottomNavigation from "./bottom-navigation"; 
import { useIsMobile } from "@/hooks/use-mobile";

interface AppLayoutProps {
  children: ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const isMobile = useIsMobile();

  return (
    <div className="min-h-screen flex flex-col">
      <TopNavigation />
      <main className={`flex-1 ${
        isMobile 
          ? "pb-20" // Bottom padding for mobile bottom nav
          : "pt-16"  // Top padding for desktop top nav
      }`}>
        {children}
      </main>
      <BottomNavigation />
    </div>
  );
}