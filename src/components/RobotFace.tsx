import { motion } from 'motion/react';
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

  // Base eye colors and glow maps
  let eyeColor = '#ffffff'; 
  let glowColor = '#cbd5e1'; // Soft warm-white/neutral default

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
    glowColor = '#475569'; // dim/gray
    eyeColor = '#94a3b8';
    xOffset = 0;
  } else {
    // Determine dynamic eye colors matching the mood
    switch (mood) {
      case 'calm':
        eyeColor = '#e6fcf5'; // Pale aquamarine / mint tint
        glowColor = '#10b981'; // Luminous mint green glow
        break;
      case 'energetic':
        eyeColor = '#fffbeb'; // Pale gold tint
        glowColor = '#f59e0b'; // Vibrant, hot gold/orange glow (Original preserved)
        break;
      case 'anxious':
        eyeColor = '#f0f9ff'; // Pale electric blue tint
        glowColor = '#06b6d4'; // Striking electric cyan/blue glow
        break;
      case 'neutral':
      default:
        eyeColor = '#fafaf9'; // Neutral off-white
        glowColor = '#cbd5e1'; // Soft neutral warm-white glow
        break;
    }

    if (isAiSpeaking) {
      eyeScale = 1.05;
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

  // Define dynamic gradients and colors for perfect chromatic harmony
  let baseGradient = '';
  let shadowCoreGradient = '';
  let rimLightGradient = '';
  let moodGlowColor = '#475569';

  switch(mood) {
    case 'calm':
      baseGradient = 'radial-gradient(circle at 35% 25%, #2dd4bf 0%, #14b8a6 20%, #0d9488 45%, #0f766e 70%, #042f2e 100%)';
      shadowCoreGradient = 'radial-gradient(circle at 50% 100%, #011c18 0%, rgba(1, 28, 24, 0) 50%)';
      rimLightGradient = 'radial-gradient(circle at 70% 80%, rgba(45, 212, 191, 0.45) 0%, transparent 55%)';
      moodGlowColor = '#14b8a6';
      break;
    case 'energetic':
      baseGradient = 'radial-gradient(circle at 35% 25%, #fcd34d 0%, #f59e0b 15%, #ec4899 40%, #86198f 70%, #2e0854 100%)';
      shadowCoreGradient = 'radial-gradient(circle at 50% 100%, #120021 0%, rgba(18, 0, 33, 0) 50%)';
      rimLightGradient = 'radial-gradient(circle at 70% 80%, rgba(251, 191, 36, 0.45) 0%, transparent 55%)';
      moodGlowColor = '#f59e0b';
      break;
    case 'anxious':
      baseGradient = 'radial-gradient(circle at 35% 25%, #60a5fa 0%, #3b82f6 20%, #1d4ed8 45%, #1e3a8a 70%, #030712 100%)';
      shadowCoreGradient = 'radial-gradient(circle at 50% 100%, #01040f 0%, rgba(1, 4, 15, 0) 50%)';
      rimLightGradient = 'radial-gradient(circle at 70% 80%, rgba(147, 197, 253, 0.45) 0%, transparent 55%)';
      moodGlowColor = '#3b82f6';
      break;
    case 'neutral':
    default:
      baseGradient = 'radial-gradient(circle at 35% 25%, #cbd5e1 0%, #94a3b8 20%, #64748b 45%, #475569 70%, #0f172a 100%)';
      shadowCoreGradient = 'radial-gradient(circle at 50% 100%, #030712 0%, rgba(3, 7, 18, 0) 50%)';
      rimLightGradient = 'radial-gradient(circle at 70% 80%, rgba(241, 245, 249, 0.35) 0%, transparent 55%)';
      moodGlowColor = '#475569';
      break;
  }

  return (
    <div className={`relative mx-auto flex items-center justify-center ${size === 'sm' ? 'w-24 h-24 scale-[0.35]' : 'w-72 h-72'}`}>
      
      {/* Outer ambient glow - harmonized to mood's color palette */}
      <motion.div
        animate={{
          scale: isAiSpeaking ? 1.25 : (isConnected ? 1.05 : 0.95),
          opacity: isAiSpeaking ? 0.45 : (isConnected ? 0.25 : 0.1),
        }}
        transition={{ duration: isAiSpeaking ? 0.3 : 2, repeat: Infinity, repeatType: 'reverse', ease: "easeInOut" }}
        className="absolute inset-0 rounded-full blur-[45px] transition-colors duration-500"
        style={{ backgroundColor: moodGlowColor }}
      />

      {/* Deep diffused shadow underneath (the "Face Lift") to simulate high floating altitude */}
      <motion.div
        animate={{
          y: isAiSpeaking ? [35, 42, 35] : [35, 38, 35],
          scale: isAiSpeaking ? [0.8, 0.75, 0.8] : [0.8, 0.78, 0.8],
          opacity: isConnected ? 0.7 : 0.35
        }}
        transition={{ duration: isAiSpeaking ? 0.5 : 3, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-[-18%] w-[75%] h-[12%] bg-black/80 rounded-full blur-[26px] pointer-events-none z-0 transition-all duration-1000"
      />
      
      {/* Head Chassis / 3D Glass Orb with rich volumetric shading */}
      <motion.div
        animate={{ y: isAiSpeaking ? [0, -7, 0] : [0, -3, 0] }}
        transition={{ duration: isAiSpeaking ? 0.5 : 3, repeat: Infinity, ease: "easeInOut" }}
        className="relative z-10 w-64 h-64 rounded-full flex items-center justify-center overflow-hidden transition-all duration-1000"
        style={{
          background: baseGradient,
          boxShadow: `
            inset -20px -20px 50px rgba(0,0,0,0.95),
            inset 15px 15px 30px rgba(255,255,255,0.3),
            0 60px 100px -25px rgba(0,0,0,0.9),
            0 20px 40px -10px rgba(0,0,0,0.65),
            0 0 0 1px rgba(255,255,255,0.1)
          `
        }}
      >
        {/* Layer 2: Shadow Core (adds deep visual weight) */}
        <div 
          className="absolute inset-0 pointer-events-none transition-all duration-1000"
          style={{
            background: shadowCoreGradient,
          }}
        />

        {/* Layer 3: Distinct Bottom-Right Crescent Rim Light (light bounce) */}
        <div 
          className="absolute inset-0 pointer-events-none rounded-full transition-all duration-1000"
          style={{
            background: rimLightGradient,
            mixBlendMode: 'screen',
          }}
        />

        {/* Layer 4: Specular Highlights & Glare (creates the glossy studio glass texture) */}
        {/* Soft lightbox window shape reflection */}
        <div className="absolute top-[8%] left-[10%] w-[45%] h-[22%] bg-gradient-to-b from-white/70 via-white/20 to-transparent rounded-[100%] blur-[2px] pointer-events-none rotate-[-35deg]" />
        
        {/* Sharp specular highlight for realistic 3D reflection */}
        <div className="absolute top-[12%] left-[14%] w-[20%] h-[8%] bg-gradient-to-b from-white/85 to-transparent rounded-[100%] blur-[0.5px] pointer-events-none rotate-[-35deg]" />

        {/* Subtle secondary bounce glare on the top-right curve */}
        <div className="absolute top-[18%] right-[15%] w-[12%] h-[6%] bg-gradient-to-b from-white/15 to-transparent rounded-[100%] blur-[1px] pointer-events-none rotate-[25deg]" />

        {/* Eye Container (Layer 5 - Floating on top) */}
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
                 boxShadow: `0 0 25px ${glowColor}, 0 0 50px ${glowColor}, inset 0 0 8px #ffffff`
               }}
            />
            {/* Right Eye */}
            <motion.div
                animate={{ height: rightHeight, width: rightWidth, y: rightY, scale: eyeScale }}
                transition={{ type: "spring", stiffness: 350, damping: 25 }}
               className="rounded-full shadow-lg transition-colors duration-300"
               style={{
                  backgroundColor: eyeColor,
                 boxShadow: `0 0 25px ${glowColor}, 0 0 50px ${glowColor}, inset 0 0 8px #ffffff`
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
             style={{ border: `3px solid ${glowColor}`, filter: 'blur(5px)' }}
           />
        )}
      </motion.div>
    </div>
  );
}
