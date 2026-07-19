const fs = require('fs');
let code = fs.readFileSync('src/components/RobotFace.tsx', 'utf8');

// Add size prop
code = code.replace(
  "exaggerated?: boolean;",
  "exaggerated?: boolean;\n  size?: 'sm' | 'default';"
);
code = code.replace(
  "export function RobotFace({ isAiSpeaking, isUserSpeaking, isConnected, exaggerated = false }: RobotFaceProps)",
  "export function RobotFace({ isAiSpeaking, isUserSpeaking, isConnected, exaggerated = false, size = 'default' }: RobotFaceProps)"
);

// Light Theme Orb Changes
// glowColor: orange -> amber-500, blue-600
code = code.replace(/let glowColor = '#f97316';/g, "let glowColor = '#3b82f6';"); // blue for standby
code = code.replace(/let eyeColor = '#ffedd5';/g, "let eyeColor = '#ffffff';"); 
code = code.replace(/glowColor = '#94a3b8';/g, "glowColor = '#cbd5e1';"); // offline

code = code.replace(/glowColor = '#fbbf24';/g, "glowColor = '#f59e0b';"); // amber for ai speaking
code = code.replace(/glowColor = '#f97316';/g, "glowColor = '#2563eb';"); // bright blue for user speaking

// Background of the orb
code = code.replace(
  "background: 'radial-gradient(circle at 50% 30%, #5a2e10 0%, #170a03 70%, #000000 100%)',",
  "background: 'radial-gradient(circle at 50% 30%, #ffffff 0%, #f1f5f9 60%, #e2e8f0 100%)',"
);
code = code.replace(
  "inset 0 0 40px rgba(0,0,0,0.8),",
  "inset 0 0 40px rgba(0,0,0,0.05),"
);
code = code.replace(
  "inset 0 -20px 40px rgba(249, 115, 22, 0.2),",
  "inset 0 -20px 40px rgba(59, 130, 246, 0.1),"
);
code = code.replace(
  "0 20px 40px rgba(0,0,0,0.6)",
  "0 20px 40px rgba(0,0,0,0.1)"
);
code = code.replace(
  "border-orange-950/50",
  "border-slate-200"
);

// Resizing logic wrapper
code = code.replace(
  "<div className=\"relative w-72 h-72 mx-auto flex items-center justify-center\">",
  "<div className={`relative mx-auto flex items-center justify-center ${size === 'sm' ? 'w-24 h-24 scale-[0.35]' : 'w-72 h-72'}`}>"
);

fs.writeFileSync('src/components/RobotFace.tsx', code);
