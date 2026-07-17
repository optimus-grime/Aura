const fs = require('fs');

let serverCode = fs.readFileSync('server.ts', 'utf8');

const adminImport = `import admin from 'firebase-admin';
import fs_node from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
let projectId = 'personal-hub-492517';
try {
  const configContent = fs_node.readFileSync(path.join(__dirname, 'firebase-applet-config.json'), 'utf-8');
  projectId = JSON.parse(configContent).projectId;
} catch (e) {
  console.warn("Could not read firebase config, using default", e);
}
admin.initializeApp({ projectId });

const authenticateUser = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing or invalid token' });
  }

  const token = authHeader.split('Bearer ')[1];
  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error('Error verifying Firebase token:', error);
    return res.status(403).json({ error: 'Unauthorized: Invalid token' });
  }
};
`;

// Add imports
serverCode = serverCode.replace("import { createServer } from 'http';", "import { createServer } from 'http';\n" + adminImport);

// Add middleware usage before endpoints
serverCode = serverCode.replace("app.post('/api/summarize-layered-insights',", "app.use('/api', authenticateUser);\n\n  app.post('/api/summarize-layered-insights',");

// Add token verification to websocket
const wsConnectionTarget = `wss.on('connection', async (clientWs) => {`;
const wsConnectionReplacement = `wss.on('connection', async (clientWs, req) => {
    try {
      const url = new URL(req.url, \`http://\${req.headers.host}\`);
      const token = url.searchParams.get('token');
      if (!token) throw new Error("Missing token");
      await admin.auth().verifyIdToken(token);
    } catch (error) {
      console.error("WebSocket auth failed:", error.message);
      clientWs.close(1008, "Unauthorized");
      return;
    }
`;

serverCode = serverCode.replace(wsConnectionTarget, wsConnectionReplacement);

fs.writeFileSync('server.ts', serverCode);
