const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const moodLogic = `
  // Derived mood for RobotFace
  let currentMood: 'neutral' | 'calm' | 'energetic' | 'anxious' = 'neutral';
  if (savedReports && savedReports.length > 0) {
    const latest = savedReports[0].report;
    if (latest.readiness && latest.readiness.score) {
      if (latest.readiness.score >= 75) currentMood = 'energetic';
      else if (latest.readiness.score >= 45) currentMood = 'calm';
      else currentMood = 'anxious';
    } else if (latest.sentimentAnalysis && latest.sentimentAnalysis.overallSentiment) {
      const sent = latest.sentimentAnalysis.overallSentiment.toLowerCase();
      if (sent.includes('positive') || sent.includes('joy') || sent.includes('happy') || sent.includes('energetic')) currentMood = 'energetic';
      else if (sent.includes('calm') || sent.includes('peace') || sent.includes('neutral')) currentMood = 'calm';
      else if (sent.includes('negative') || sent.includes('anxious') || sent.includes('tired')) currentMood = 'anxious';
    }
  }

  return (`;

code = code.replace('  return (', moodLogic);

const oldFaceBlock = `<div className="relative mb-6 scale-90">
            <RobotFace 
              isAiSpeaking={isSpeaking} 
              isUserSpeaking={userIsSpeaking} 
              isConnected={true} 
              exaggerated={true}
            />
          </div>`;

const newFaceBlock = `<div className="relative my-8">
            <RobotFace 
              isAiSpeaking={isSpeaking} 
              isUserSpeaking={userIsSpeaking} 
              isConnected={true} 
              exaggerated={true}
              mood={currentMood}
            />
          </div>`;

code = code.replace(oldFaceBlock, newFaceBlock);

fs.writeFileSync('src/App.tsx', code);
console.log("Patched App.tsx successfully.");
