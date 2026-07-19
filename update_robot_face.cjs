const fs = require('fs');

const code = `import { motion } from 'motion/react';
import { useState, useEffect, useRef } from 'react';

export type MoodState = 'calm' | 'energetic' | 'anxious' | 'neutral';

interface RobotFaceProps {
  isAiSpeaking?: boolean;
  isUserSpeaking?: boolean;
  isConnected?: boolean;
  exaggerated?: boolean;
  size?: 'sm' | 'default';
  mood?: MoodState;
}

export function RobotFace({ 
  isAiSpeaking = false, 
  isUserSpeaking = false, 
  isConnected = false, 
  exaggerated = false, 
  size = 'default',
  mood = 'neutral'
}: RobotFaceProps) {
  const [expression, setExpression] = useState<'neutral' | 'thinking' | 'surprised' | 'raised-brow' | 'squint'>('neutral');
  const [isBlinking, setIsBlinking] = useState(false);
  const [lookDir, setLookDir] = useState<number>(0);
  
  const stateRef = useRef({ isAiSpeaking, isUserSpeaking, exaggerated, isConnected, mood });
  useEffect(() => {
    stateRef.current = { isAiSpeaking, isUserSpeaking, exaggerated, isConnected, mood };
  }, [isAiSpeaking, isUserSpeaking, exaggerated, isConnected, mood]);

  // Expression logic
  useEffect(() => {
    if (!isConnected) {
      setExpression('neutral');
      setLookDir(0);
      return;
    }
    if (isUserSpeaking) {
       const exps = ['neutral', 'squint', 'raised-brow', 'surprised'];
       setExpression(exps[Math.floor(Math.random() * exps.length)] as any);
       setLookDir(0);
    } else if (isAiSpeaking) {
       setExpression('neutral');
       setLookDir(0);
    } else {
       setExpression('neutral');
       setLookDir(0);
    }
  }, [isAiSpeaking, isUserSpeaking, isConnected]);

  // Drifting expressions & looking around
  useEffect(() => {
    if (!isConnected) return;
    const expInterval = setInterval(() => {
       const { isUserSpeaking: userSpk, isAiSpeaking: aiSpk, exaggerated: isExagg } = stateRef.current;
       if (userSpk) {
         if (Math.random() > 0.4) {
            const exps = ['neutral', 'squint', 'raised-brow', 'surprised'];
            setExpression(exps[Math.floor(Math.random() * exps.length)] as any);
            setLookDir(Math.random() > 0.6 ? (Math.random() > 0.5 ? 1 : -1) : 0);
         }
       } else if (aiSpk) {
         if (Math.random() > (isExagg ? 0.3 : 0.6)) {
           const exps = isExagg ? ['neutral', 'raised-brow', 'thinking', 'surprised', 'squint'] : ['neutral', 'raised-brow'];
           setExpression(exps[Math.floor(Math.random() * exps.length)] as any);
           setLookDir(Math.random() > 0.4 ? (Math.random() > 0.5 ? 1 : -1) : 0);
         }
       } else {
         if (Math.random() > (isExagg ? 0.2 : 0.4)) {
           const exps = isExagg ? ['neutral', 'thinking', 'raised-brow', 'squint'] : ['neutral', 'thinking'];
           setExpression(exps[Math.floor(Math.random() * exps.length)] as any);
           setLookDir(Math.random() > 0.4 ? (Math.random() > 0.5 ? 1 : -1) : 0);
         }
       }
    }, exaggerated ? 1500 : 2800);
    return () => clearInterval(expInterval);
  }, [isConnected, exaggerated]);

  // Blinking logic
  useEffect(() => {
    if (!isConnected) {
      setIsBlinking(false);
      return;
    }
    let timeoutId: any;
    const blinkLoop = () => {
      setIsBlinking(true);
      setTimeout(() => {
        setIsBlinking(false);
      }, 150);
      timeoutId = setTimeout(blinkLoop, 2000 + Math.random() * 5000);
    };
    timeoutId = setTimeout(blinkLoop, 1000);
    return () => clearTimeout(timeoutId);
  }, [isConnected]);

  // Base eye colors (Vibrant orange/gold preserved against base color)
  let eyeColor = '#ffffff'; 
  let glowColor = '#f59e0b'; // Gold glow for standby

  // Structural bases
  let leftHeight = 60;
  let rightHeight = 60;
  let leftWidth = 32;
  let rightWidth = 32;
  let leftY = 0;
  let rightY = 0;
  let xOffset = lookDir * 12;
  let eyeScale = 1;
  let lookY = 0;

  if (!isConnected) {
    leftHeight = rightHeight = 6;
    glowColor = '#94a3b8'; // gray
    eyeColor = '#e2e8f0';
    xOffset = 0;
  } else {
    // Mode Colors
    if (isAiSpeaking) {
      eyeScale = 1.05;
      glowColor = '#fb923c'; // vibrant orange when speaking
    } else if (isUserSpeaking) {
      glowColor = '#fcd34d'; // brighter yellow-gold when listening
    }

    // Expressions
    switch (expression) {
      case 'surprised': 
        leftHeight = rightHeight = exaggerated ? 100 : 84;
        leftWidth = rightWidth = exaggerated ? 60 : 46;
        leftY = rightY = -5;
        break;
      case 'raised-brow': 
        leftHeight = exaggerated ? 70 : 60;
        leftWidth = exaggerated ? 40 : 32;
        leftY = 0;
        rightHeight = exaggerated ? 95 : 78;
        rightWidth = exaggerated ? 48 : 38;
        rightY = exaggerated ? -15 : -12;
        break;
      case 'squint': 
        leftHeight = rightHeight = exaggerated ? 15 : 24;
        leftWidth = rightWidth = exaggerated ? 50 : 40;
        leftY = rightY = exaggerated ? 8 : 5;
        break;
      case 'thinking': 
        leftHeight = rightHeight = exaggerated ? 60 : 50;
        leftWidth = rightWidth = exaggerated ? 40 : 30;
        xOffset = lookDir !== 0 ? lookDir * (exaggerated ? 25 : 20) : (exaggerated ? 20 : 15);
        lookY = -15; 
        break;
      case 'neutral':
      default:
        leftHeight = rightHeight = exaggerated ? 70 : 60;
        leftWidth = rightWidth = exaggerated ? 40 : 32;
        break;
    }
  }

  // Blinking override
  if (isBlinking && isConnected) {
    leftHeight = rightHeight = 4;
  }

  // Determine dynamic gradient based on mood
  let baseGradient = '';
  switch(mood) {
    case 'calm':
      baseGradient = 'radial-gradient(circle at 25% 25%, #2dd4bf 0%, #0d9488 35%, #115e59 65%, #022c22 100%)';
      break;
    case 'energetic':
      baseGradient = 'radial-gradient(circle at 25% 25%, #e879f9 0%, #c026d3 35%, #86198f 65%, #4a044e 100%)'; // Warm Plum
      break;
    case 'anxious':
    case 'neutral':
    default:
      // Deep Satiny Blue
      baseGradient = 'radial-gradient(circle at 25% 25%, #60a5fa 0%, #2563eb 35%, #1e3a8a 65%, #020617 100%)';
      break;
  }

  return (
    <div className={\`relative mx-auto flex items-center justify-center \${size === 'sm' ? 'w-24 h-24 scale-[0.35]' : 'w-72 h-72'}\`}>
      
      {/* Outer ambient glow */}
      <motion.div
        animate={{
          scale: isAiSpeaking ? 1.25 : (isConnected ? 1.05 : 0.95),
          opacity: isAiSpeaking ? 0.4 : (isConnected ? 0.2 : 0.1),
        }}
        transition={{ duration: isAiSpeaking ? 0.3 : 2, repeat: Infinity, repeatType: 'reverse', ease: "easeInOut" }}
        className="absolute inset-0 rounded-full blur-[40px] transition-colors duration-500"
        style={{ backgroundColor: glowColor }}
      />
      
      {/* Head Chassis / 3D Orb */}
      <motion.div
        animate={{ y: isAiSpeaking ? [0, -5, 0] : [0, -2, 0] }}
        transition={{ duration: isAiSpeaking ? 0.5 : 3, repeat: Infinity, ease: "easeInOut" }}
        className="relative z-10 w-64 h-64 rounded-full shadow-2xl flex items-center justify-center overflow-hidden transition-all duration-1000"
        style={{
          background: baseGradient,
          boxShadow: \`
            inset -20px -20px 50px rgba(0,0,0,0.8),
            inset 15px 15px 30px rgba(255,255,255,0.3),
            0 25px 50px -12px rgba(0,0,0,0.6),
            0 0 0 1px rgba(255,255,255,0.05)
          \`
        }}
      >
        {/* Studio Lighting Specular Highlights (Top-Left) */}
        <div className="absolute top-2 left-6 w-32 h-16 bg-gradient-to-br from-white/60 to-transparent rounded-[100%] blur-md pointer-events-none rotate-[-35deg]" />
        <div className="absolute top-4 left-8 w-16 h-8 bg-white/40 rounded-[100%] blur-sm pointer-events-none rotate-[-35deg]" />

        {/* Secondary lower rim reflection */}
        <div className="absolute bottom-1 right-2 w-48 h-12 bg-gradient-to-t from-white/10 to-transparent rounded-[100%] blur-lg pointer-events-none rotate-[-15deg]" />

        {/* Eye Container */}
        <div className="w-full h-full flex items-center justify-center relative z-20">
          <motion.div
              animate={{ x: xOffset, y: lookY }}
              transition={{ type: "spring", stiffness: 120, damping: 20 }}
            className="flex items-center justify-center space-x-10"
          >
            {/* Left Eye */}
            <motion.div
                animate={{ height: leftHeight, width: leftWidth, y: leftY, scale: eyeScale }}
                transition={{ type: "spring", stiffness: 350, damping: 25 }}
               className="rounded-full shadow-lg transition-colors duration-300"
               style={{
                  backgroundColor: eyeColor,
                 boxShadow: \`0 0 30px \${glowColor}, 0 0 60px \${glowColor}, inset 0 0 10px #ffffff\`
               }}
            />
            {/* Right Eye */}
            <motion.div
                animate={{ height: rightHeight, width: rightWidth, y: rightY, scale: eyeScale }}
                transition={{ type: "spring", stiffness: 350, damping: 25 }}
               className="rounded-full shadow-lg transition-colors duration-300"
               style={{
                  backgroundColor: eyeColor,
                 boxShadow: \`0 0 30px \${glowColor}, 0 0 60px \${glowColor}, inset 0 0 10px #ffffff\`
               }}
            />
          </motion.div>
        </div>

        {/* AI Speaking Inner Pulse Ring */}
        {isConnected && isAiSpeaking && (
           <motion.div
             initial={{ opacity: 0, scale: 0.8 }}
             animate={{ opacity: [0, 0.4, 0], scale: [0.8, 1.1, 0.8] }}
             transition={{ duration: 0.8, repeat: Infinity, ease: "easeInOut" }}
             className="absolute w-40 h-40 rounded-full pointer-events-none"
             style={{ border: \`3px solid \${glowColor}\`, filter: 'blur(5px)' }}
           />
        )}
      </motion.div>
    </div>
  );
}
`;
fs.writeFileSync('src/components/RobotFace.tsx', code);
