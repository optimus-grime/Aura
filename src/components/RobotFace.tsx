import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

interface RobotFaceProps {
  isAiSpeaking: boolean;
  isUserSpeaking: boolean;
  isConnected: boolean;
  exaggerated?: boolean;
}

export function RobotFace({ isAiSpeaking, isUserSpeaking, isConnected, exaggerated = false }: RobotFaceProps) {
  const [expression, setExpression] = useState<'neutral' | 'thinking' | 'surprised' | 'raised-brow' | 'squint'>('neutral');
  const [lookDir, setLookDir] = useState(0); // -1 left, 0 center, 1 right
  const [isBlinking, setIsBlinking] = useState(false);

  const stateRef = useRef({ isAiSpeaking, isUserSpeaking, exaggerated });
  useEffect(() => {
    stateRef.current = { isAiSpeaking, isUserSpeaking, exaggerated };
  }, [isAiSpeaking, isUserSpeaking, exaggerated]);

  // Instant response to interaction changes
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
    
    // Check state inside the interval
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

  // Base colors
  let glowColor = '#f97316'; // orange glow for offline/standby
  let eyeColor = '#ffedd5'; // bright inner core

  // Structural bases
  let leftHeight = 60;
  let rightHeight = 60;
  let leftWidth = 32;
  let rightWidth = 32;
  let leftY = 0;
  let rightY = 0;
  let xOffset = lookDir * 12;
  let eyeScale = 1;
  let lookY = 0; // for thinking up/down

  if (!isConnected) {
    leftHeight = rightHeight = 6;
    glowColor = '#94a3b8'; // gray
    eyeColor = '#e2e8f0';
    xOffset = 0;
  } else {
    // Mode Colors & Pulse
    if (isAiSpeaking) {
      eyeScale = 1.05;
      glowColor = '#fbbf24'; // amber
    } else if (isUserSpeaking) {
      glowColor = '#f97316'; // orange
    }

    // Expressions
    switch (expression) {
      case 'surprised': // Wide eyes
        leftHeight = rightHeight = exaggerated ? 100 : 84;
        leftWidth = rightWidth = exaggerated ? 60 : 46;
        leftY = rightY = -5;
        break;
      case 'raised-brow': // One eye raised and larger, one slightly squints
        leftHeight = exaggerated ? 70 : 60;
        leftWidth = exaggerated ? 40 : 32;
        leftY = 0;
        rightHeight = exaggerated ? 95 : 78;
        rightWidth = exaggerated ? 48 : 38;
        rightY = exaggerated ? -15 : -12;
        break;
      case 'squint': // Squinting / Listening intently
        leftHeight = rightHeight = exaggerated ? 15 : 24;
        leftWidth = rightWidth = exaggerated ? 50 : 40;
        leftY = rightY = exaggerated ? 8 : 5;
        break;
      case 'thinking': // Looking up/away slightly
        leftHeight = rightHeight = exaggerated ? 60 : 50;
        leftWidth = rightWidth = exaggerated ? 40 : 30;
        xOffset = lookDir !== 0 ? lookDir * (exaggerated ? 25 : 20) : (exaggerated ? 20 : 15);
        lookY = -15; // move inner eye container up
        break;
      case 'neutral':
      default:
        // Default standard sizes
        leftHeight = rightHeight = exaggerated ? 70 : 60;
        leftWidth = rightWidth = exaggerated ? 40 : 32;
        break;
    }
  }

  // Blinking override (closes eyes vertically)
  if (isBlinking && isConnected) {
    leftHeight = rightHeight = 4;
  }

  return (
    <div className="relative w-72 h-72 mx-auto flex items-center justify-center">
      {/* Outer ambient glow */}
      <motion.div
        animate={{
          scale: isAiSpeaking ? 1.2 : 0.95,
          opacity: isAiSpeaking ? 0.6 : 0.2,
        }}
        transition={{ duration: isAiSpeaking ? 0.3 : 2, repeat: Infinity, repeatType: 'reverse', ease: "easeInOut" }}
        className="absolute inset-0 rounded-full blur-3xl transition-colors duration-500"
        style={{ backgroundColor: glowColor }}
      />

      {/* Head Chassis / Orb */}
      <motion.div
        animate={{ y: isAiSpeaking ? [0, -5, 0] : [0, -2, 0] }}
        transition={{ duration: isAiSpeaking ? 0.5 : 3, repeat: Infinity, ease: "easeInOut" }}
        className="relative z-10 w-64 h-64 rounded-full border border-orange-950/50 shadow-2xl flex items-center justify-center overflow-hidden"
        style={{
          background: 'radial-gradient(circle at 50% 30%, #5a2e10 0%, #170a03 70%, #000000 100%)',
          boxShadow: `
            inset 0 0 40px rgba(0,0,0,0.8),
            inset 0 -20px 40px rgba(249, 115, 22, 0.2),
            0 20px 40px rgba(0,0,0,0.6)
          `
        }}
      >
        {/* Specular highlight to make it look spherical */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 w-48 h-20 bg-white/5 rounded-[100%] blur-xl pointer-events-none" />

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
                 boxShadow: `0 0 30px ${glowColor}, 0 0 60px ${glowColor}, inset 0 0 10px #ffffff`
               }}
            />

            {/* Right Eye */}
            <motion.div
               animate={{ height: rightHeight, width: rightWidth, y: rightY, scale: eyeScale }}
               transition={{ type: "spring", stiffness: 350, damping: 25 }}
               className="rounded-full shadow-lg transition-colors duration-300"
               style={{ 
                 backgroundColor: eyeColor,
                 boxShadow: `0 0 30px ${glowColor}, 0 0 60px ${glowColor}, inset 0 0 10px #ffffff`
               }}
            />
          </motion.div>
        </div>

        {/* AI Speaking Inner Pulse Ring */}
        {isConnected && isAiSpeaking && (
           <motion.div 
             initial={{ opacity: 0, scale: 0.8 }}
             animate={{ opacity: [0, 0.3, 0], scale: [0.8, 1.1, 0.8] }}
             transition={{ duration: 0.8, repeat: Infinity, ease: "easeInOut" }}
             className="absolute w-40 h-40 rounded-full pointer-events-none"
             style={{ border: `2px solid ${glowColor}`, filter: 'blur(4px)' }}
           />
        )}
      </motion.div>
    </div>
  );
}
