"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Hexagon } from "lucide-react";

interface SplashScreenProps {
  minimumLoadTimeMs?: number;
}

export function SplashScreen({ minimumLoadTimeMs = 2500 }: SplashScreenProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, minimumLoadTimeMs);

    return () => clearTimeout(timer);
  }, [minimumLoadTimeMs]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 backdrop-blur-md"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
        >
          {/* Network pattern background */}
          <div className="absolute inset-0 overflow-hidden opacity-35">
            <svg className="w-full h-full" viewBox="0 0 800 600" xmlns="http://www.w3.org/2000/svg">
              <g stroke="#FF4500" strokeWidth="0.3" fill="none" opacity="0.5">
                <path d="M100,100 L200,150 L300,80 L400,200" />
                <path d="M500,300 L600,250 L700,350 L500,400" />
                <path d="M150,400 L250,450 L350,350 L450,500" />
                <path d="M600,100 L500,200 L700,250 L650,50" />
                <circle cx="100" cy="100" r="3" fill="#FF4500" />
                <circle cx="200" cy="150" r="3" fill="#FF4500" />
                <circle cx="300" cy="80" r="3" fill="#FF4500" />
                <circle cx="400" cy="200" r="3" fill="#FF4500" />
                <circle cx="500" cy="300" r="3" fill="#FF4500" />
                <circle cx="600" cy="250" r="3" fill="#FF4500" />
                <circle cx="700" cy="350" r="3" fill="#FF4500" />
                <circle cx="500" cy="400" r="3" fill="#FF4500" />
                <circle cx="150" cy="400" r="3" fill="#FF4500" />
                <circle cx="250" cy="450" r="3" fill="#FF4500" />
                <circle cx="350" cy="350" r="3" fill="#FF4500" />
                <circle cx="450" cy="500" r="3" fill="#FF4500" />
                <circle cx="600" cy="100" r="3" fill="#FF4500" />
                <circle cx="500" cy="200" r="3" fill="#FF4500" />
                <circle cx="700" cy="250" r="3" fill="#FF4500" />
                <circle cx="650" cy="50" r="3" fill="#FF4500" />
              </g>
            </svg>
          </div>

          {/* Background hexagon */}
          <div className="absolute inset-0 flex items-center justify-center opacity-70">
            <Hexagon className="w-[80vw] h-[80vw] max-w-[600px] max-h-[600px] text-white" strokeWidth={0.1} fill="black" fillOpacity={0.9} />
          </div>

          <div className="relative z-10 flex flex-col items-center justify-center space-y-8">
            {/* Main logo and text */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="flex flex-col items-center"
            >
              <div className="flex items-center mb-4">
                <Hexagon className="w-12 h-12 mr-2 text-primary" />
                <motion.h1 
                  className="text-4xl md:text-6xl font-bold tracking-tight"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 1, delay: 0.5 }}
                >
                  <span className="text-white">Crypto</span>
                  <span className="text-amber-500">Path</span>
                </motion.h1>
              </div>
              <motion.p
                className="text-gray-400 text-sm md:text-base mt-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1, delay: 0.8 }}
              >
                The all-in-one crypto app in Vietnam
              </motion.p>
            </motion.div>

            {/* Loading indicator */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 1 }}
              className="flex flex-col items-center mt-6"
            >
              <div className="relative w-48 h-1 bg-gray-800 rounded-full overflow-hidden mb-4">
                <motion.div 
                  className="absolute h-full bg-gradient-to-r from-amber-400 to-amber-600 rounded-full"
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ 
                    duration: minimumLoadTimeMs / 1000 - 0.5,
                    ease: "easeInOut"
                  }}
                />
              </div>
              <p className="text-xs text-gray-500 animate-pulse">
                Preparing your crypto journey...
              </p>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
