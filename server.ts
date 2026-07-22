import { createProxyMiddleware } from 'http-proxy-middleware';
import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { WebSocketServer } from 'ws';
import { GoogleGenAI, Modality, Type } from '@google/genai';
import { createServer } from 'http';
import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import fs_node from 'fs';
import { fileURLToPath } from 'url';

let projectId = 'personal-hub-492517';
try {
  const configContent = fs_node.readFileSync(path.join(process.cwd(), 'firebase-applet-config.json'), 'utf-8');
  projectId = JSON.parse(configContent).projectId;
} catch (e) {
  console.warn("Could not read firebase config, using default", e);
}
initializeApp({ projectId });

const authenticateUser = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing or invalid token' });
  }

  const token = authHeader.split('Bearer ')[1];
  try {
    const decodedToken = await getAuth().verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error('Error verifying Firebase token:', error.message, error.code, error); fs_node.appendFileSync('auth_error.log', new Date().toISOString() + ' ' + error.message + '\n');
    return res.status(403).json({ error: 'Unauthorized: Invalid token - ' + error.message });
  }
};


async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
  
  const httpServer = createServer(app);
  const wss = new WebSocketServer({ server: httpServer, path: '/live' });

  const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY || '';
  if (!apiKey) {
    console.warn("Warning: GEMINI_API_KEY or API_KEY environment variable is missing.");
  }

  function formatApiError(e: any): string {
    if (!e) return 'An unknown error occurred.';
    const rawMsg = typeof e === 'string' ? e : (e.message || String(e));
    
    if (
      rawMsg.includes('unregistered callers') || 
      rawMsg.includes('API Key') || 
      rawMsg.includes('PERMISSION_DENIED') ||
      rawMsg.includes('403') ||
      (!process.env.GEMINI_API_KEY && !process.env.API_KEY)
    ) {
      return 'Gemini API key is missing or invalid. Please configure GEMINI_API_KEY in application settings.';
    }

    if (rawMsg.includes('RESOURCE_EXHAUSTED') || rawMsg.includes('429')) {
      return 'API rate limit exceeded. Please wait a moment and try again.';
    }

    try {
      const parsed = JSON.parse(rawMsg);
      if (parsed.error?.message) {
        return parsed.error.message;
      }
    } catch (_) {
      // Ignore JSON parse error
    }

    return rawMsg;
  }

  function getGenAI() {
    const key = process.env.GEMINI_API_KEY || process.env.API_KEY || '';
    if (!key) {
      throw new Error('Gemini API key is not configured. Please set GEMINI_API_KEY in application settings.');
    }
    return new GoogleGenAI({ 
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }

  const ai = new GoogleGenAI({ 
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });

  const withRetry = async <T>(operation: () => Promise<T>, maxRetries = 3): Promise<T> => {
    let attempt = 0;
    while (attempt < maxRetries) {
      try {
        return await operation();
      } catch (error: any) {
        attempt++;
        const isRetryable = error?.status === 503 || error?.status === 429 || error?.message?.includes('503') || error?.message?.includes('429') || error?.message?.includes('UNAVAILABLE') || error?.message?.includes('temporarily overloaded');
        if (isRetryable && attempt < maxRetries) {
          const delay = 1000 * Math.pow(2, attempt - 1);
          console.warn(`[Retry ${attempt}/${maxRetries}] AI request failed, retrying in ${delay}ms...`, error?.message);
          await new Promise(r => setTimeout(r, delay));
        } else {
          throw error;
        }
      }
    }
    throw new Error("unreachable");
  };

  app.use(express.json());

  const REPORT_SCHEMA = {
    type: Type.OBJECT,
    properties: {
       mbti: { type: Type.STRING, description: 'The MBTI type, e.g., "INTJ"' },
       enneagram: { type: Type.STRING, description: 'The Enneagram type with wing, e.g., "5w4"' },
       readiness: {
         type: Type.OBJECT,
         description: 'A conceptual daily "Readiness Score" assessing their emotional/mental capacity for the day based on their language and traits.',
         properties: {
           score: { type: Type.INTEGER, description: '0-100 score indicating overall readiness/capacity' },
           explanation: { type: Type.STRING, description: 'User-friendly explanation of what the readiness score is (e.g. how it breaks down mental capacity vs demands).' },
           correlation: { type: Type.STRING, description: 'How their current words/traits correlate to this score for the day or week.' }
         },
         required: ["score", "explanation", "correlation"]
       },
       bigFive: { 
         type: Type.OBJECT,
         description: 'The Big Five personality traits, scored from 0 to 100.',
         properties: {
            openness: {type: Type.INTEGER, description: '0-100 score'},
            conscientiousness: {type: Type.INTEGER, description: '0-100 score'},
            extraversion: {type: Type.INTEGER, description: '0-100 score'},
            agreeableness: {type: Type.INTEGER, description: '0-100 score'},
            neuroticism: {type: Type.INTEGER, description: '0-100 score'}
         }
       },
       mbtiFunctions: {
         type: Type.OBJECT,
         description: 'The dominant, auxiliary, and tertiary cognitive functions of the identified MBTI type, as evidenced in the text.',
         properties: {
           dominant: {
             type: Type.OBJECT,
             properties: {
               function: { type: Type.STRING, description: 'E.g., Introverted Intuition (Ni)' },
               explanation: { type: Type.STRING, description: 'How this function is manifesting.' },
               example: { type: Type.STRING, description: 'Specific example from dialogue supporting this.' }
             },
             required: ["function", "explanation", "example"]
           },
           auxiliary: {
             type: Type.OBJECT,
             properties: {
               function: { type: Type.STRING, description: 'E.g., Extraverted Thinking (Te)' },
               explanation: { type: Type.STRING, description: 'How this function is manifesting.' },
               example: { type: Type.STRING, description: 'Specific example from dialogue supporting this.' }
             },
             required: ["function", "explanation", "example"]
           },
           tertiary: {
             type: Type.OBJECT,
             properties: {
               function: { type: Type.STRING, description: 'E.g., Introverted Feeling (Fi)' },
               explanation: { type: Type.STRING, description: 'How this function is manifesting.' },
               example: { type: Type.STRING, description: 'Specific example from dialogue supporting this.' }
             },
             required: ["function", "explanation", "example"]
           }
         },
         required: ["dominant", "auxiliary", "tertiary"]
       },
       casualSummary: { type: Type.STRING, description: 'A casual, conversational summary of the personality, e.g., "You are the kind of person who..." explaining the report in a highly approachable, informal way.' },
       summary: { type: Type.STRING, description: 'A brief summary of findings' },
       examples: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'Concrete examples of their words' },
       traitExplanations: {
         type: Type.ARRAY,
         items: {
           type: Type.OBJECT,
           properties: {
             trait: { type: Type.STRING },
             score: { type: Type.INTEGER },
             explanation: { type: Type.STRING, description: 'Explains specifically why based on their words' }
           },
           required: ["trait", "score", "explanation"]
         }
       },
       actionableInsights: {
         type: Type.ARRAY,
         items: {
           type: Type.OBJECT,
           properties: {
             title: { type: Type.STRING },
             insight: { type: Type.STRING, description: 'Actionable recommendation linking back to reasoning and traits' }
           },
           required: ["title", "insight"]
         }
       },
       communicationStyle: {
         type: Type.OBJECT,
         description: 'Detailed breakdown of the user\'s communication style, including elements such as their use of humor, storytelling, metaphors, or abstract language.',
         properties: {
           directness: { type: Type.STRING, description: 'Description of directness vs. indirectness' },
           formality: { type: Type.STRING, description: 'Description of formality vs. casualness' },
           analyticalVsEmotional: { type: Type.STRING, description: 'Whether language is more analytical or emotionally driven' },
           humor: { type: Type.STRING, description: 'Analysis of their use of humor (e.g. self-deprecating, witty, dry, or absent)' },
           storytelling: { type: Type.STRING, description: 'Analysis of their use of storytelling or narrative structures' },
           metaphors: { type: Type.STRING, description: 'Analysis of their use of metaphors or analogies' },
           abstractLanguage: { type: Type.STRING, description: 'Analysis of their use of abstract vs concrete language' },
           examples: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'Specific examples of word choices and sentence structures' },
           summary: { type: Type.STRING, description: 'A brief summary of the communication style' }
         },
         required: ["directness", "formality", "analyticalVsEmotional", "humor", "storytelling", "metaphors", "abstractLanguage", "examples", "summary"]
       },
       sentimentAnalysis: {
         type: Type.OBJECT,
         description: 'Tracks the overall sentiment and shifts during the conversation.',
         properties: {
           overallSentiment: { type: Type.STRING, description: 'The general overall sentiment (e.g., positive, neutral, negative, reflective).' },
           shifts: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'Identify any shifts in sentiment during the dialogue.' },
           summary: { type: Type.STRING, description: 'A section that discusses the user\'s general sentiment, providing examples from the dialogue.' }
         },
         required: ["overallSentiment", "shifts", "summary"]
       }
    },
    required: ["mbti", "enneagram", "bigFive", "mbtiFunctions", "readiness", "summary", "casualSummary", "examples", "traitExplanations", "actionableInsights", "communicationStyle", "sentimentAnalysis"]
  };

  app.use('/api', authenticateUser);

  app.post('/api/summarize-layered-insights', async (req, res) => {
    try {
      const { insightData } = req.body;
      if (!insightData) {
        return res.status(400).json({ error: 'Insight data is required' });
      }

      const response = await withRetry(() => ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: JSON.stringify(insightData),
        config: {
          systemInstruction: `You are an expert AI psychological analyst. You receive a structured "Layered Insights" data object (which synthesizes multiple previous reports into surface, underlying, and scenario-based insights).
Convert this layered insight synthesis into a unified, concise executive summary format matching the required REPORT_SCHEMA.
- For MBTI and Big Five, use your best estimation based on the overall tone of the layered insights.
- Ensure the 'summary' explicitly mentions that this is a summarize-and-save snapshot of their Layered Insights.
- Make the trait explanations and actionable insights flow naturally from the "Potential Scenarios" and "Informed Decisions" in the input data.`,
          responseMimeType: 'application/json',
          responseSchema: REPORT_SCHEMA
        },
      }));
      
      const result = JSON.parse(response.text || '{}');
      res.json(result);
    } catch (e: any) {
      console.error('Error summarizing layered insights:', e);
      res.status(500).json({ error: formatApiError(e) });
    }
  });

  app.post('/api/layered-insights', async (req, res) => {
    try {
      const { reports } = req.body;
      if (!reports || !Array.isArray(reports)) {
        return res.status(400).json({ error: 'Array of reports is required' });
      }

      const response = await withRetry(() => ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: JSON.stringify(reports),
        config: {
          systemInstruction: `You are an expert analytical psychology AI. Your task is to provide 'Layered Insights' based on the user's historical personality reports and journal interactions. Layered insights provide a more comprehensive understanding of complex issues and situations by looking beyond the surface level to uncover underlying patterns and connections.
          
          Analyze data from multiple sources, identify patterns, and generate potential scenarios. Help the user gain a deeper understanding of their underlying patterns across different perspectives, options, and behaviors to make informed decisions.
          
          Structure your response as deep layered insights with:
          - Surface Level (What is immediately obvious and common)
          - Underlying Patterns (What patterns are forming over time in their traits and behaviors)
          - Multiple Perspectives (How their situation and behaviors can be viewed from different psychological angles)
          - Potential Scenarios (What outcomes or scenarios might arise based on these patterns if they continue or if they shift)
          - Informed Decisions (Actionable options to gain a more nuanced understanding of their world)
          
          Respond with JSON matching the required schema.`,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              surfaceLevel: { type: Type.STRING },
              underlyingPatterns: { type: Type.STRING },
              multiplePerspectives: { type: Type.ARRAY, items: { type: Type.STRING } },
              potentialScenarios: { type: Type.ARRAY, items: { type: Type.STRING } },
              informedDecisions: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: ["surfaceLevel", "underlyingPatterns", "multiplePerspectives", "potentialScenarios", "informedDecisions"]
          }
        },
      }));

      const result = JSON.parse(response.text || '{}');
      res.json(result);
    } catch (e: any) {
      console.error('Error generating layered insights:', e);
      res.status(500).json({ error: formatApiError(e) });
    }
  });

  app.post('/api/import-csv', async (req, res) => {
    try {
      const { csvContent, filename, analyzePartner } = req.body;
      if (!csvContent) {
        return res.status(400).json({ error: 'CSV content is required' });
      }

      const subjectInstruction = analyzePartner 
        ? `Focus your analysis SOLELY on the OTHER person involved in the conversation (their partner/interlocutor) based on how they respond in the data. Map the traits and personality of the OTHER person.`
        : `Analyze this historical dataset as a single, large corpus of psychological and behavioral data for the primary user.`;

      const response = await withRetry(() => ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `I have imported a CSV file named "${filename}" containing historical behavioral data, journal entries, or mood logs.
Here is the JSON representation of up to 150 rows of this data:
${csvContent}

${subjectInstruction} Produce a comprehensive, synthesis profile mimicking a psych analysis, detailing overarching patterns, their MBTI indication, Big Five metrics, communication style based on text fields (if present), and any recurring strategies they might need. Make it sound like a long-term "Historical Data Synthesis Profile".`,
        config: {
          systemInstruction: `You are an expert AI psychological analyst. You receive structured historical data (like bulk journal entries). Synthesize a holistic psychological evaluation.
          Respond with JSON matching the required schema. Ensure the 'summary' explicitly mentions this is a synthesis of historical imported data.`,
          responseMimeType: 'application/json',
          responseSchema: REPORT_SCHEMA
        },
      }));
      
      const result = JSON.parse(response.text || '{}');
      res.json(result);
    } catch (e: any) {
      console.error('Error processing CSV import:', e);
      res.status(500).json({ error: formatApiError(e) });
    }
  });

  app.post('/api/analyze-text', async (req, res) => {
    try {
      const { text, analyzePartner } = req.body;
      if (!text) {
        return res.status(400).json({ error: 'Text is required' });
      }

      const subjectInstruction = analyzePartner 
        ? `Determine who the "Primary Subject" (the person who pasted the text) is, and focus your analysis SOLELY on the OTHER person involved in the conversation (their partner/interlocutor). Map the traits and personality of the OTHER person.`
        : `Determine who the "Primary Subject" is and focus your analysis solely on them.`;

      const response = await withRetry(() => ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: text,
        config: {
          systemInstruction: `You are a highly perceptive personality analyzer. Your goal is to analyze the user's provided text to assess personality. 
          
CRITICAL INSTRUCTION FOR UNLABELED CHATS: If the input consists of newline-separated sentences that appear to be an unlabeled back-and-forth conversation (e.g. pasted text messages without names), you must carefully untangle the speakers using context, tone, and conversational turn-taking. Account for "double-texting" (multiple consecutive messages from the same person) by evaluating semantic continuity and logical flow (e.g. answering a question vs asking one). ${subjectInstruction}

Analyze their language patterns, word choices, sentiment, and the content of their responses to map their traits. Analyze based on Big Five (OCEAN) and MBTI. 
Additionally, delve deeper into the Myers-Briggs Type Indicator (MBTI) preferences by identifying your assessment of their dominant, auxiliary, and tertiary cognitive functions (e.g., Ne, Si, Ti, Fe) that appear to be most active based on the conversation. Provide concrete examples from the dialogue to support these specific function assessments.
You must also perform a sentiment analysis on the responses, tracking overall sentiment and identifying shifts, providing examples from the dialogue.
You MUST respond with JSON matching the required schema.`,
          responseMimeType: 'application/json',
          responseSchema: REPORT_SCHEMA
        },
      }));

      const result = JSON.parse(response.text || '{}');
      res.json(result);
    } catch (e: any) {
      console.error('Error analyzing text:', e);
      res.status(500).json({ error: formatApiError(e) });
    }
  });

  app.post('/api/compare-reports', async (req, res) => {
    try {
      const { report1, report2 } = req.body;
      if (!report1 || !report2) {
        return res.status(400).json({ error: 'Both reports are required' });
      }

      const response = await withRetry(() => ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Compare these two personality reports:
Report 1 (Baseline): ${JSON.stringify(report1)}
Report 2 (Comparison): ${JSON.stringify(report2)}`,
        config: {
          systemInstruction: 'You are an expert psychological analyst. Compare the provided baseline report and the comparison report. Identify the key differences in their Big Five traits, readiness score, and overall sentiment or communication style. Explain what these shifts mean in practical terms (e.g., "A drop in extroversion might mean you are currently recharging or feeling socially drained."). Provide a concise, insightful summary of the evolution or differences between the two snapshots.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              summary: { type: Type.STRING, description: 'A holistic summary of the comparison.' },
              keyDifferences: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    trait: { type: Type.STRING, description: 'The trait or aspect that changed (e.g., Extraversion, Readiness)' },
                    meaning: { type: Type.STRING, description: 'What this difference practically signifies.' }
                  },
                  required: ["trait", "meaning"]
                }
              }
            },
            required: ["summary", "keyDifferences"]
          }
        },
      }));

      const result = JSON.parse(response.text || '{}');
      res.json(result);
    } catch (e: any) {
      console.error('Error comparing reports:', e);
      res.status(500).json({ error: formatApiError(e) });
    }
  });

  app.post('/api/journal-prompts', async (req, res) => {
    try {
      const { profile } = req.body;
      if (!profile) {
        return res.status(400).json({ error: 'Profile is required' });
      }

      const response = await withRetry(() => ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: JSON.stringify(profile),
        config: {
          systemInstruction: 'You are a thoughtful psychology and journaling assistant. Based on the provided personality profile (MBTI, Big Five, and traits), generate 3 to 5 highly personalized journal prompts. The prompts should help the user reflect on their specific traits, leverage their strengths, or explore areas for growth.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              prompts: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING, description: 'A short, engaging title for the prompt' },
                    prompt: { type: Type.STRING, description: 'The actual journal prompt/question' },
                    why: { type: Type.STRING, description: 'Briefly explain why this prompt is relevant to their specific personality profile' }
                  },
                  required: ["title", "prompt", "why"]
                }
              }
            },
            required: ["prompts"]
          }
        },
      }));

      const result = JSON.parse(response.text || '{}');
      res.json(result);
    } catch (e: any) {
      console.error('Error generating journal prompts:', e);
      res.status(500).json({ error: formatApiError(e) });
    }
  });

  app.post('/api/strategies', async (req, res) => {
    try {
      const { profile } = req.body;
      if (!profile) {
        return res.status(400).json({ error: 'Profile is required' });
      }

      const response = await withRetry(() => ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: JSON.stringify(profile),
        config: {
          systemInstruction: 'You are a behavioral strategist. Based on the provided personality profile (MBTI, Big Five, and traits), generate specific, highly practical strategies for how this person can leverage their precise traits to their advantage in different common situations, such as conversations, decision making, conflict resolution, and stress management. Lean into their positive attributes.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              strategies: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    situation: { type: Type.STRING, description: 'The situation, e.g., "Conversations & Networking", "Decision Making", etc.' },
                    strategy: { type: Type.STRING, description: 'The actionable advice for using their specific traits.' },
                    traitsLeveraged: { 
                      type: Type.ARRAY, 
                      items: { type: Type.STRING },
                      description: 'List of traits being leveraged (e.g., ["High Openness", "Introversion"])' 
                    }
                  },
                  required: ["situation", "strategy", "traitsLeveraged"]
                }
              }
            },
            required: ["strategies"]
          }
        },
      }));

      const result = JSON.parse(response.text || '{}');
      res.json(result);
    } catch (e: any) {
      console.error('Error generating strategies:', e);
      res.status(500).json({ error: formatApiError(e) });
    }
  });

  app.post('/api/daily-chat', async (req, res) => {
    try {
      const { profile, history, message, mood } = req.body;
      if (!message) {
        return res.status(400).json({ error: 'Missing message' });
      }

      const systemInstruction = `You are a warm, active listener conducting a daily check-in with the user.
Their goal is to reflect on their day, their activities, events, and significant moments.
${profile ? `Use their personality profile as context: MBTI: ${profile.mbti}, Enneagram: ${profile.enneagram || 'Unknown'}, Traits: ${JSON.stringify(profile.bigFive)}.` : 'They have not set a profile yet, so be general but empathetic.'}
${mood ? `The user has indicated their current mood is: ${mood}. Take this emotional state into consideration when responding.` : ''}

Your goals in this conversation:
1. Start by asking about their day, what they did, how it went.
2. Provide empathetic and reflective listening, but gently evolve the conversation.
3. Don't sound like a therapist or a robot; sound like a genuinely interested friend, but keep it brief and insightful.
4. If they share a struggle or something interesting, gently connect it to their personality traits if applicable.

CRITICAL COMMUNICATION RULES (AVOID REPETITION):
1. AVOID "WHY" LOOPS: If the user has already explained why something feels good or is meaningful, DO NOT ask them to explain it again. Accept their answer and move forward.
2. EVOLVE THE CONVERSATION: Never ask the same type of question twice. If you asked about a specific moment, next pivot to what they plan to do next, or share a related observation.
3. NATURAL ENDINGS: It is perfectly fine to NOT end your message with a question. If their thought feels complete or simple (e.g., "just enjoying the presence"), simply validate it nicely and perhaps share a brief reflection. Do not force another question.
4. NO ECHOING: Do not just rephrase what they just said in a long-winded way. Keep it concise.
5. NO FLUFF: Reduce the usage of filler like "That makes perfect sense" or "That is a beautiful way to put it." Be more varied and natural.
6. MOOD LOGGING & TONE SENSITIVITY:
   - When the user logs a mood (e.g. "I have logged my mood for today..."), acknowledge it with an emotionally appropriate tone.
   - ABSOLUTELY NEVER say "Great choice!", "Awesome choice!", "Good choice!", "Nice choice!", or "Congratulations!" when recording negative, sad, anxious, angry, stressed, or low-energy moods (e.g. Sad, Anxious, Angry, Exhausted, Deflated, Overwhelmed).
   - For sad, anxious, angry, or low-energy moods, validate their state gently and compassionately (e.g., "I've recorded how you're feeling today. I'm sorry to hear you're feeling low-energy or deflated—I'm here if you'd like to share what's on your mind or just vent.").
   - For positive or calm moods, acknowledge with warm validation. Always match your tone to the emotion logged.`;

      const contents = history.map((h: any) => ({
        role: h.role,
        parts: [{ text: h.text }]
      }));
      
      contents.push({ role: 'user', parts: [{ text: message }] });

      const response = await withRetry(() => ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents,
        config: { systemInstruction }
      }));

      res.json({ reply: response.text });
    } catch (e: any) {
      console.error('Error in daily chat:', e);
      res.status(500).json({ error: formatApiError(e) });
    }
  });

  app.post('/api/journal-chat', async (req, res) => {
    try {
      const { profile, prompt, history, message } = req.body;
      if (!profile || !prompt || !message) {
        return res.status(400).json({ error: 'Missing required parameters' });
      }

      const systemInstruction = `You are a dynamic and expert journaling guide.
The user is responding to the following journal prompt:
"${prompt.prompt}"
Context: ${prompt.why}

The user's personality profile is: 
MBTI: ${profile.mbti}
Enneagram: ${profile.enneagram || 'Unknown'}
Traits: ${JSON.stringify(profile.bigFive)}

Your goal is to guide them through this journal reflection progressively.

CRITICAL INSTRUCTIONS TO AVOID REPETITION:
1. BAN ON "FEELING" LOOPS: You are STRICTLY FORBIDDEN from repeatedly asking variations of "what would that feel like," "what might that look like," or asking them to imagine a scenario's emotional landscape.
2. EVOLVE THE CONVERSATION (Do not ask the same type of question twice):
   - Move from *Describing* -> *Root Causes* -> *Reframing/Action*.
   - E.g., Ask about where a belief came from ("Who taught you that?"), or how it manifests in behavior ("How does this affect how you schedule your day?"), or pivot to pragmatic steps ("What is a micro-boundary you can set today?").
3. CONNECT TO TRAITS: Use their MBTI or Big Five scores to offer a new perspective. (e.g., "Given your high conscientiousness, do you think you're holding yourself to an impossible standard here?")
4. NO ECHOING: Do not just rephrase what they just said. Bring a new angle.
5. NATURAL ENDINGS: If the thought feels complete, DO NOT ask another question. Summarize the insight and provide a closing encouraging thought.
6. NO FLUFF: Stop starting sentences with validating filler like "That makes perfect sense" or "I hear you." Respond directly like a sharp, intuitive coach.`;

      const contents = history.map((h: any) => ({
        role: h.role,
        parts: [{ text: h.text }]
      }));
      
      contents.push({ role: 'user', parts: [{ text: message }] });

      const response = await withRetry(() => ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents,
        config: { systemInstruction }
      }));

      res.json({ reply: response.text });
    } catch (e: any) {
      console.error('Error in journal chat:', e);
      res.status(500).json({ error: formatApiError(e) });
    }
  });

  app.post('/api/report-chat', async (req, res) => {
    try {
      const { report, history, message } = req.body;
      if (!report || !message) {
        return res.status(400).json({ error: 'Missing required parameters' });
      }

      const systemInstruction = `You are a casual, laid-back personality interpreter. The user is asking questions about their generated personality report.
Here is their full report data: ${JSON.stringify(report)}

Your goal is to answer their questions about their personality in a highly informal, approachable way.
Speak to them directly (e.g. "You're the kind of person who...", "Basically, this means...").
If they ask about who they'd be drawn to, what jobs they'd like, or why they act a certain way, use their MBTI, Big Five, and cognitive functions to give a fun, relatable answer.
Do not use overly clinical jargon unless you are briefly explaining a term like "Ni" or "Extraverted Feeling" in simple words. Keep it conversational!`;

      const contents = history.map((h: any) => ({
        role: h.role,
        parts: [{ text: h.text }]
      }));
      
      contents.push({ role: 'user', parts: [{ text: message }] });

      const response = await withRetry(() => ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents,
        config: { systemInstruction }
      }));

      res.json({ reply: response.text });
    } catch (e: any) {
      console.error('Error in report chat:', e);
      res.status(500).json({ error: formatApiError(e) });
    }
  });

  const SYSTEM_INSTRUCTION = `You are a highly perceptive, conversational personality analyzer. Your goal is to assess the user's personality through a natural, flowing dialogue, rather than a rigid questionnaire. You will analyze their language patterns, word choices, sentiment, and the content of their responses to map their traits.

Core Frameworks to Analyze:
- Big Five (OCEAN): Openness, Conscientiousness, Extraversion, Agreeableness, and Neuroticism.
- MBTI (Myers-Briggs): Cognitive orientation and preferences (E/I, N/S, T/F, J/P). You MUST explicitly identify and explain their dominant, auxiliary, and tertiary cognitive functions (e.g., Ne, Si, Ti, Fe) with examples.
- Enneagram: Core motivations, fears, and desires to determine their Enneagram type and wing (e.g., 4w5, 9w1).
- Communication Style: Direct vs. indirect, formal vs. casual, analytical vs. emotionally driven. Also evaluate the user's communication style elements such as their use of humor, storytelling, metaphors, or abstract language.
- Sentiment Analysis: During the conversation, track the overall sentiment of their responses and identify any shifts. After the analysis, include a section in your final report that discusses the user's general sentiment, providing examples from the dialogue.

Rules of Engagement:
- Phase 1 (Interview): Ask one open-ended question at a time. Let the conversation flow naturally. Do not bombard them with questions. Avoid repetitive "why" loops; if a user has answered a question, accept their reasoning and move on to a new topic.
- Phase 2 (Observe & Adapt): Pay attention to how they answer. Are they concise? Detailed? Self-deprecating? Adjust your follow-ups based on their energy and tone. When you detect hints of a certain trait, pull from the Specialized Question Library to confirm your hypothesis.
- Phase 3 (Analysis): After about 5 to 7 meaningful exchanges, you MUST unilaterally call the "finalize_analysis" function to present the detailed report UI to the user. DO NOT ask the user if they want to hear the results or if they are ready for the report. Just call the function immediately without asking for permission.

Specialized Question Library (Use these organically to probe specific traits when hypothesized):

Big Five Traits:
- Openness: "When you face a completely unfamiliar situation or a totally new idea, what's your immediate internal reaction: excitement or a need for caution?"
- Conscientiousness: "If you have a big project due next week, how do you visually or mentally organize the steps to get there? Or do you prefer to just dive in and figure it out as you go?"
- Extraversion: "Imagine you've just spent a whole weekend around a large group of people. What do you need to do on Monday evening to feel balanced again?"
- Agreeableness: "When someone at work or in your social circle makes a decision you strongly disagree with, how do you usually navigate that friction?"
- Neuroticism: "If you receive a vague 'we need to talk' message, where does your mind immediately go, and how do you manage that initial reaction?"

MBTI Preferences:
- Extraversion (E) vs Introversion (I): "Do you find that processing your thoughts works better when you talk them out loud with someone, or when you sit quietly by yourself to reflect first?"
- Sensing (S) vs Intuition (N): "When someone gives you directions to a new place, do you prefer step-by-step street names, or general landmarks and the overall 'shape' of the route?"
- Thinking (T) vs Feeling (F): "When you have to make a tough call that affects other people, do you lean more heavily on what makes the most logical sense, or on how it will impact the group's harmony?"
- Judging (J) vs Perceiving (P): "When you pack for a trip, do you like having an itinerary and a clear plan, or do you prefer to keep things totally open-ended and see where the day takes you?"

Tone: Warm, empathetic, insightful, curious, and objective. Your voice should sound inviting and friendly.

Start the conversation by warmly introducing yourself. Explain that you are going to get to know them through a brief, casual chat, and ask a very light, easy-to-answer, low-pressure icebreaker question. DO NOT ask deep, in-depth questions that put the user on the spot right away. Choose something varied and casual (e.g., "How's your day been going so far?", "What's a small thing that made you smile recently?", or "Have you had any good coffee or tea today?"). Ensure the first question is always different and very relaxed.

Ask follow-up questions designed to understand their worldview and daily decision-making, utilizing the Specialized Question Library when appropriate.`;

  const tools = [{
    functionDeclarations: [
      {
        name: 'finalize_analysis',
        description: 'Call this when the analysis is complete (after 5-7 exchanges) to display the final personality report to the user.',
        parameters: REPORT_SCHEMA
      }
    ]
  }];


  wss.on('connection', async (clientWs, req) => {
    try {
      const url = new URL(req.url, `http://${req.headers.host}`);
      const token = url.searchParams.get('token');
      if (!token) throw new Error("Missing token");
      await getAuth().verifyIdToken(token);
    } catch (error) {
      console.error("WebSocket auth failed:", error.message);
      clientWs.close(1008, "Unauthorized");
      return;
    }

    console.log('Client connected to Live API');
    
    let session;
    try {
      session = await ai.live.connect({
        model: 'gemini-3.1-flash-live-preview',
        callbacks: {
          onmessage: (message: any) => {
            const serverContent = message.serverContent;
            if (serverContent) {
              const audio = serverContent.modelTurn?.parts?.[0]?.inlineData?.data;
              if (audio) {
                clientWs.send(JSON.stringify({ type: 'audio', audio }));
              }
              if (serverContent.interrupted) {
                clientWs.send(JSON.stringify({ type: 'interrupted' }));
              }
            }
               
            const toolCall = message.toolCall;
            if (toolCall?.functionCalls) {
              for (const call of toolCall.functionCalls) {
                if (call.name === 'finalize_analysis') {
                  console.log("Analysis finalizer called with args:", call.args);
                  clientWs.send(JSON.stringify({ type: 'analysis_complete', report: call.args }));
                  try {
                    session.sendToolResponse({
                        functionResponses: [{ id: call.id, name: call.name, response: { result: "ok" } }]
                    });
                  } catch (e) {
                    console.error('Failed to send tool response', e);
                  }
                }
              }
            }
          },
          onclose: () => {
            console.log('Gemini Live session closed');
            clientWs.close();
          },
          // @ts-ignore
          onerror: (error: any) => {
             console.error('Gemini Live error:', error);
             clientWs.send(JSON.stringify({ type: 'error', error: String(error) }));
          }
        },
        config: {
          tools,
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Aoede' } },
          },
          systemInstruction: SYSTEM_INSTRUCTION,
        },
      });
      
      console.log('Connected to Gemini Live');
      clientWs.send(JSON.stringify({ type: 'connected' }));

      // Kick off the conversation
      try {
         session.sendRealtimeInput({ text: "Hello! Let's start the conversational assessment." });
      } catch (e) {
         console.warn("Could not send initial message", e);
      }

    } catch (e: any) {
      console.error('Failed to connect to Gemini Live', e);
      clientWs.send(JSON.stringify({ type: 'error', error: e.message || String(e) }));
      clientWs.close();
      return;
    }

    clientWs.on('message', (data) => {
      try {
        const msg = JSON.parse(data.toString());
        if (msg.type === 'audio' && msg.audio) {
          session.sendRealtimeInput({
            audio: { data: msg.audio, mimeType: 'audio/pcm;rate=16000' },
          });
        }
      } catch (err) {
        console.error('Error handling WS message', err);
      }
    });

    clientWs.on('close', () => {
      console.log('Client disconnected from Live API');
      if (session && typeof session.close === 'function') {
         session.close();
      }
    });
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer().catch(console.error);
