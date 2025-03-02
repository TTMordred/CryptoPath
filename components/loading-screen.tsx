import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface LoadingScreenProps {
  isLoading: boolean;
  message?: string;
}

export function LoadingScreen({
  isLoading,
  message = "Searching the Blockchain...",
}: LoadingScreenProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isLoading) {
      setVisible(true);
    } else {
      // Add a small delay before hiding to allow for fade-out animation
      const timer = setTimeout(() => {
        setVisible(false);
      }, 50); 
      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  if (!visible && !isLoading) return null;

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/70 backdrop-blur-sm transition-opacity duration-300",
        isLoading ? "opacity-100" : "opacity-0"
      )}
    >
      <div className="cube-container">
        <div className="cube">
          <div className="face front"></div>
          <div className="face back"></div>
          <div className="face right"></div>
          <div className="face left"></div>
          <div className="face top"></div>
          <div className="face bottom"></div>
        </div>
      </div>
      <p className="mt-8 text-xl font-medium text-white animate-pulse">{message}</p>
    </div>
  );
}