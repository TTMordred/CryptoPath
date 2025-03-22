'use client';
import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

interface ClickAnimationProps {
  clickPosition: { x: number; y: number } | null;
  value: number;
}

const ClickAnimation: React.FC<ClickAnimationProps> = ({ clickPosition, value }) => {
  const [animations, setAnimations] = useState<Array<{ id: number; x: number; y: number; value: number }>>([]);

  // Create a new animation when click position changes
  useEffect(() => {
    if (clickPosition) {
      const newAnimation = {
        id: Date.now(),
        x: clickPosition.x,
        y: clickPosition.y,
        value
      };
      
      setAnimations(prevAnimations => [...prevAnimations, newAnimation]);
      
      // Clean up old animations
      const timer = setTimeout(() => {
        setAnimations(prevAnimations => 
          prevAnimations.filter(anim => anim.id !== newAnimation.id)
        );
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [clickPosition, value]);

  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      <AnimatePresence>
        {animations.map(animation => (
          <motion.div
            key={animation.id}
            className="absolute text-green-400 font-bold text-lg"
            initial={{ 
              x: animation.x, 
              y: animation.y, 
              opacity: 1, 
              scale: 0.5 
            }}
            animate={{ 
              y: animation.y - 80,
              opacity: 0,
              scale: 1
            }}
            exit={{ opacity: 0 }}
            transition={{ 
              duration: 0.8,
              ease: "easeOut"
            }}
          >
            +{animation.value.toFixed(1)}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default ClickAnimation;
