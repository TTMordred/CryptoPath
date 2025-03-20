'use client';

import { useEffect, useState } from 'react';
import Script from 'next/script';

// Extend the global window interface to include particlesJS
declare global {
  interface Window {
    particlesJS: (tagId: string, config: object) => void;
  }
}

const particlesConfig = {
  particles: {
    number: {
      value: 35,
      density: {
        enable: true,
        value_area: 800,
      },
    },
    color: {
      value: "#f5b056", 
    },
    shape: {
      type: "circle",
    },
    opacity: {
      value: 0.5,
      random: false,
    },
    size: {
      value: 3,
      random: true,
    },
    line_linked: {
      enable: true,
      distance: 150,
      color: "#ffc259", 
      opacity: 0.4,
      width: 1,
    },
    move: {
      enable: true,
      speed: 2,
      direction: "none",
      random: false,
      straight: false,
      out_mode: "out",
    },
  },
  interactivity: {
    detect_on: "window", // Changed from "window" to "canvas" for better performance
    events: {
      onhover: {
        enable: true,
        mode: "grab",
      },
      onclick: {
        enable: false,
        mode: "push",
      },
    },
    modes: {
      grab: {
        distance: 200,
        line_linked: {
          opacity: 0.5,
        },
      },
      push: {
        particles_nb: 4,
      },
    },
  },
  retina_detect: true,
};

const ParticlesBackground = () => {
  const [scriptLoaded, setScriptLoaded] = useState(false);

  const initParticles = () => {
    try {
      console.log("Initializing particles...");
      if (window.particlesJS && document.getElementById('particles-js')) {
        window.particlesJS("particles-js", particlesConfig);
        console.log("Particles initialized successfully");
        setScriptLoaded(true);
      } else {
        console.error("particlesJS not available or particles-js element not found");
      }
    } catch (error) {
      console.error("Error initializing particles:", error);
    }
  };

  useEffect(() => {
    // Try to initialize if the script is already loaded
    if (typeof window !== "undefined" && "particlesJS" in window) {
      console.log("particlesJS found in window - initializing");
      // Add a small delay to ensure DOM is ready
      const timer = setTimeout(() => {
        initParticles();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, []);

  return (
    <>
      <Script
        src="https://cdn.jsdelivr.net/npm/particles.js@2.0.0/particles.min.js"
        strategy="afterInteractive"
        onLoad={() => {
          console.log("Particles.js script loaded");
          initParticles();
        }}
        onError={(e) => console.error("Failed to load particles.js script:", e)}
      />
      <div
        id="particles-js"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          zIndex: -1, // Changed from -1 to 0
          backgroundColor: "transparent", // Changed from #000000 to transparent
          pointerEvents: "none", // Changed from auto to none
        }}
        data-loaded={scriptLoaded ? "true" : "false"}
      />
    </>
  );
};

export default ParticlesBackground;