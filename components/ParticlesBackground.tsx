'use client';

import { useEffect } from 'react';
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
      value: 100,
      density: {
        enable: true,
        value_area: 800,
      },
    },
    color: {
      value: "FF0000", 
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
      color: "#FF0000", 
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
    detect_on: "window", 
    events: {
      onhover: {
        enable: true,
        mode: "grab",
      },
      onclick: {
        enable: true,
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
  const initParticles = () => {
    if (window.particlesJS) {
      window.particlesJS("particles-js", particlesConfig);
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined" && "particlesJS" in window) 
      {
        initParticles();
      }
  }, []);

  return (
    <>
      <Script
        src="https://cdn.jsdelivr.net/particles.js/2.0.0/particles.min.js"
        strategy="afterInteractive"
        onLoad={initParticles}
      />
      <div
        id="particles-js"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          zIndex: -1,
          backgroundColor: "#000000", 
          pointerEvents: "auto", 
        }}
      />
    </>
  );
};

export default ParticlesBackground;
