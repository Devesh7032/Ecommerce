import React, { useEffect } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';

interface NexaFoxProps {
  className?: string;
  size?: number;
}

export const NexaFox: React.FC<NexaFoxProps> = ({ className = '', size = 300 }) => {
  // Motion values for tracking cursor offset
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Springs for smooth, physics-based rotation
  const springConfig = { damping: 25, stiffness: 100, mass: 0.8 };
  const rotateX = useSpring(mouseY, springConfig);
  const rotateY = useSpring(mouseX, springConfig);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const { innerWidth, innerHeight } = window;
      
      // Calculate normalized cursor offsets from screen center (-1 to 1)
      const xOffset = (e.clientX - innerWidth / 2) / (innerWidth / 2);
      const yOffset = (e.clientY - innerHeight / 2) / (innerHeight / 2);

      // Map to max 25 degrees of rotation (pitch and yaw)
      mouseX.set(xOffset * 25);
      mouseY.set(yOffset * -25);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [mouseX, mouseY]);

  return (
    <motion.div 
      className={`relative flex items-center justify-center cursor-pointer ${className}`}
      style={{
        width: size,
        height: size,
        rotateX,
        rotateY,
        perspective: 800,
        transformStyle: 'preserve-3d'
      }}
      whileHover={{ scale: 1.03 }}
      transition={{ type: 'spring', stiffness: 300, damping: 15 }}
    >
      <svg 
        viewBox="0 0 100 100" 
        className="w-full h-full filter drop-shadow-[0_16px_32px_rgba(227,86,57,0.22)] select-none pointer-events-none"
        style={{ transformStyle: 'preserve-3d' }}
      >
        {/* Soft shadow below the mascot */}
        <ellipse cx="50" cy="92" rx="30" ry="4" fill="rgba(227,86,57,0.12)" filter="blur(3px)" />

        {/* LEFT EAR */}
        <polygon points="50,38 18,25 30,55" fill="#E35639" /> {/* Outer Left */}
        <polygon points="18,25 22,48 30,55" fill="#CE482C" /> {/* Inner Left */}
        <polygon points="18,25 15,35 22,48" fill="#2B2523" /> {/* Ear Canal Left */}

        {/* RIGHT EAR */}
        <polygon points="50,38 82,25 70,55" fill="#E35639" /> {/* Outer Right */}
        <polygon points="82,25 78,48 70,55" fill="#CE482C" /> {/* Inner Right */}
        <polygon points="82,25 85,35 78,48" fill="#2B2523" /> {/* Ear Canal Right */}

        {/* FOREHEAD */}
        <polygon points="50,38 30,55 50,60" fill="#E35639" /> {/* Left Forehead Upper */}
        <polygon points="50,38 70,55 50,60" fill="#E35639" /> {/* Right Forehead Upper */}
        <polygon points="50,38 38,30 30,55" fill="#F16E53" /> {/* Left Forehead Side */}
        <polygon points="50,38 62,30 70,55" fill="#F16E53" /> {/* Right Forehead Side */}

        {/* CHEEKS */}
        <polygon points="30,55 12,65 35,70" fill="#E35639" /> {/* Left Cheek Outer */}
        <polygon points="70,55 88,65 65,70" fill="#E35639" /> {/* Right Cheek Outer */}
        <polygon points="30,55 35,70 50,60" fill="#F16E53" /> {/* Left Cheek Inner */}
        <polygon points="70,55 65,70 50,60" fill="#F16E53" /> {/* Right Cheek Inner */}

        {/* EYE SOCKETS */}
        <polygon points="30,55 38,62 35,70" fill="#2B2523" /> {/* Left Socket */}
        <polygon points="70,55 62,62 65,70" fill="#2B2523" /> {/* Right Socket */}

        {/* GLOWING CYAN EYES */}
        <polygon points="32,58 37,61 34,65" fill="#00E5FF" className="animate-pulse" /> {/* Left Eye */}
        <polygon points="68,58 63,61 66,65" fill="#00E5FF" className="animate-pulse" /> {/* Right Eye */}

        {/* SNOUT BRIDGE */}
        <polygon points="50,60 35,70 50,75" fill="#CE482C" /> {/* Left Bridge */}
        <polygon points="50,60 65,70 50,75" fill="#CE482C" /> {/* Right Bridge */}
        <polygon points="35,70 38,82 50,75" fill="#F16E53" /> {/* Left Snout */}
        <polygon points="65,70 62,82 50,75" fill="#F16E53" /> {/* Right Snout */}

        {/* LOWER CHEEKS */}
        <polygon points="35,70 12,65 24,80 38,82" fill="#CE482C" /> {/* Left Lower */}
        <polygon points="65,70 88,65 76,80 62,82" fill="#CE482C" /> {/* Right Lower */}
        
        <polygon points="38,82 24,80 40,86 50,83" fill="#D95338" /> {/* Left Chin Upper */}
        <polygon points="62,82 76,80 60,86 50,83" fill="#D95338" /> {/* Right Chin Upper */}

        {/* NOSE TIP */}
        <polygon points="50,75 45,82 50,83" fill="#2B2523" /> {/* Left Nose */}
        <polygon points="50,75 55,82 50,83" fill="#2B2523" /> {/* Right Nose */}

        {/* CHIN */}
        <polygon points="50,83 40,86 50,94" fill="#E35639" /> {/* Left Mouth Corner */}
        <polygon points="50,83 60,86 50,94" fill="#E35639" /> {/* Right Mouth Corner */}
      </svg>
    </motion.div>
  );
};

export default NexaFox;
