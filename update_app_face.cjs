const fs = require('fs');

const file = 'src/App.tsx';
let code = fs.readFileSync(file, 'utf8');

const targetBlock = `<RobotFace 
              isAiSpeaking={isSpeaking} 
              isUserSpeaking={userIsSpeaking} 
              isConnected={true} 
              exaggerated={true}
            />`;

if (code.includes(targetBlock)) {
  console.log("Target block found!");
} else {
  console.log("Could not find the target block.");
}
