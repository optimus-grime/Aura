import { AdaptiveMetrics, AdaptiveExample, ResponseLengthPreference, VocabularyPreference, DirectnessPreference, FocusPreference } from '../types';

// Lexical indicators for sophisticated / psychological vocabulary
const SOPHISTICATED_VOCAB_REGEX = /\b(perspective|dichotomy|nuance|subconscious|cognitive|systemic|intrinsically|paradox|synthesize|philosophical|catalyst|manifest|equilibrium|existential|articulate|deliberate|correlation|ambiguity|introspective|trajectory|dynamic|underlying|architecture|ramification|hypothesis)\b/i;

// Directness indicators
const DIRECT_ASSERTIONS_REGEX = /\b(I did|I will|I chose|I decided|I refuse|I want|I know|no|yes|clearly|definitely|straightforward|executed|shipped|finished|built|done|fixed|stopped)\b/i;
const HEDGING_EXPRESSIONS_REGEX = /\b(maybe|perhaps|I guess|kind of|sort of|I suppose|somewhat|in a way|possibly|not really sure|might be|could be|I wonder|tentatively)\b/i;

// Analytical vs Emotional vocabulary
const ANALYTICAL_WORDS_REGEX = /\b(logic|analyze|analysis|data|efficiency|system|structure|problem|solution|result|metric|function|criteria|fact|objective|calculated|variable|tradeoff|rationale|optimize|process)\b/i;
const EMOTIONAL_WORDS_REGEX = /\b(feel|felt|emotion|feeling|connection|heart|hurt|love|loved|empathy|warmth|bond|vibe|frustrated|anxious|sad|happy|upset|care|overwhelmed|vulnerable|comfort|resonance)\b/i;

/**
 * Analyzes a sequence of user messages and extracts real-time communication preference metrics.
 */
export function analyzeUserCommunication(
  messages: (string | { role?: string; text: string })[]
): AdaptiveMetrics {
  const userTexts: string[] = [];

  for (const m of messages) {
    if (typeof m === 'string') {
      if (m.trim()) userTexts.push(m.trim());
    } else if (m && typeof m === 'object') {
      if (m.role === 'user' && m.text && m.text.trim()) {
        // Exclude automated system logs like mood check-in markers for word count accuracy
        if (!m.text.startsWith('I have logged my mood for')) {
          userTexts.push(m.text.trim());
        }
      }
    }
  }

  if (userTexts.length === 0) {
    return {
      avgWordCount: 0,
      lexicalComplexityScore: 50,
      directnessScore: 50,
      analyticalRatio: 50,
      detectedLength: 'balanced',
      detectedVocabulary: 'standard',
      detectedDirectness: 'balanced',
      detectedFocus: 'balanced',
      strategySummary: 'Calibrating: Using balanced, engaging inquiries until your natural conversational style is established.'
    };
  }

  // 1. Average word count per turn
  const totalWords = userTexts.reduce((acc, text) => acc + text.split(/\s+/).filter(Boolean).length, 0);
  const avgWordCount = Math.round(totalWords / userTexts.length);

  let detectedLength: ResponseLengthPreference = 'balanced';
  if (avgWordCount <= 18) {
    detectedLength = 'concise';
  } else if (avgWordCount >= 55) {
    detectedLength = 'elaborate';
  }

  // 2. Lexical complexity & vocabulary grade
  const combinedText = userTexts.join(' ');
  const words = combinedText.split(/\s+/).filter(Boolean);
  const uniqueWords = new Set(words.map(w => w.toLowerCase().replace(/[^a-z]/g, ''))).size;
  const lexicalDiversity = words.length > 0 ? (uniqueWords / words.length) : 0.5;

  const sophisticatedMatches = (combinedText.match(new RegExp(SOPHISTICATED_VOCAB_REGEX, 'gi')) || []).length;
  const avgWordCharLength = words.length > 0 ? (words.reduce((sum, w) => sum + w.length, 0) / words.length) : 4.5;

  let lexicalScore = Math.round(
    (lexicalDiversity * 40) + 
    (Math.min(sophisticatedMatches * 10, 40)) + 
    (Math.min(Math.max((avgWordCharLength - 3.5) * 15, 0), 20))
  );
  lexicalScore = Math.max(10, Math.min(95, lexicalScore));

  let detectedVocabulary: VocabularyPreference = 'standard';
  if (lexicalScore >= 65 || sophisticatedMatches >= 2) {
    detectedVocabulary = 'sophisticated';
  } else if (lexicalScore <= 35 && avgWordCharLength < 4.4) {
    detectedVocabulary = 'casual';
  }

  // 3. Directness
  const directMatches = (combinedText.match(new RegExp(DIRECT_ASSERTIONS_REGEX, 'gi')) || []).length;
  const hedgingMatches = (combinedText.match(new RegExp(HEDGING_EXPRESSIONS_REGEX, 'gi')) || []).length;
  
  let directnessScore = 50;
  if (directMatches + hedgingMatches > 0) {
    directnessScore = Math.round((directMatches / (directMatches + hedgingMatches)) * 100);
  } else if (detectedLength === 'concise') {
    directnessScore = 65; // Short responses tend to be more declarative
  }

  let detectedDirectness: DirectnessPreference = 'balanced';
  if (directnessScore >= 65) {
    detectedDirectness = 'direct';
  } else if (directnessScore <= 38 || hedgingMatches >= 3) {
    detectedDirectness = 'nuanced';
  }

  // 4. Analytical vs Relational/Emotional
  const analyticalMatches = (combinedText.match(new RegExp(ANALYTICAL_WORDS_REGEX, 'gi')) || []).length;
  const emotionalMatches = (combinedText.match(new RegExp(EMOTIONAL_WORDS_REGEX, 'gi')) || []).length;

  let analyticalRatio = 50;
  if (analyticalMatches + emotionalMatches > 0) {
    analyticalRatio = Math.round((analyticalMatches / (analyticalMatches + emotionalMatches)) * 100);
  }

  let detectedFocus: FocusPreference = 'balanced';
  if (analyticalRatio >= 62) {
    detectedFocus = 'analytical';
  } else if (analyticalRatio <= 38) {
    detectedFocus = 'relational';
  }

  // Build human-friendly strategy summary
  let strategySummary = '';
  if (detectedLength === 'concise' && detectedDirectness === 'direct') {
    strategySummary = 'Crisp & Punchy: Formulating single-sentence, high-impact questions with zero preamble or filler.';
  } else if (detectedLength === 'elaborate' && detectedVocabulary === 'sophisticated') {
    strategySummary = 'Exploratory & Layered: Mirroring conceptual depth with multi-angle questions and philosophical space.';
  } else if (detectedFocus === 'analytical') {
    strategySummary = 'Structured & Rational: Focusing follow-ups around problem-solving criteria, trade-offs, and systems logic.';
  } else if (detectedFocus === 'relational') {
    strategySummary = 'Empathetic & Interpersonal: Centering follow-ups on interpersonal dynamics, emotions, and values.';
  } else {
    strategySummary = 'Balanced & Conversational: Gently pacing questions to match your natural flow and tone.';
  }

  return {
    avgWordCount,
    lexicalComplexityScore: lexicalScore,
    directnessScore,
    analyticalRatio,
    detectedLength,
    detectedVocabulary,
    detectedDirectness,
    detectedFocus,
    strategySummary
  };
}

/**
 * Concrete Before-and-After Examples demonstrating how adaptive questioning
 * improves conversational flow and psychological assessment accuracy.
 */
export const ADAPTIVE_QUESTIONING_EXAMPLES: AdaptiveExample[] = [
  {
    id: 'concise-direct',
    title: 'Concise & Action-Oriented',
    category: 'Length & Directness Adaptation',
    userArchetype: 'Pragmatic, high-tempo communicator (e.g. ESTJ / ISTP / High Conscientiousness)',
    userSampleResponse: '"Finished the team sprint. Hit an annoying database lockup but got it deployed by 4pm. Exhausted."',
    rigidQuestion: {
      question: '"Could you reflect on the deep emotional landscape of how that server deadlock resonated with your inner sense of vulnerability, and what deeper meaning it holds for your psychological journey?"',
      flaw: 'Overly poetic, emotionally intrusive, and fatiguing. Causes the user to shut down or reply with a blunt one-word answer ("fine"), destroying the conversational thread.'
    },
    adaptedQuestion: {
      question: '"Pushed through and got it live. Did you have to bypass test coverage to beat the 4pm wire, or did the deployment hold clean?"',
      advantage: 'Matches the user\'s crisp tempo. Shows respect for their practical achievement while immediately probing problem-solving under pressure without patronizing filler.'
    },
    flowImpact: 'Eliminates conversational friction and cognitive resistance. The user answers immediately and eagerly because the AI speaks their language.',
    analysisAccuracyImpact: 'Accurately separates operational grit (Conscientiousness) from stress reactivity (Neuroticism) and isolates Extraverted Thinking (Te) mechanics, rather than mistaking brevity for lack of emotional depth.',
    cognitiveFunctionsTargeted: ['Extraverted Thinking (Te)', 'Introverted Sensing (Si)', 'Conscientiousness']
  },
  {
    id: 'elaborate-reflective',
    title: 'Elaborate & Metaphorical',
    category: 'Depth & Vocabulary Adaptation',
    userArchetype: 'Introspective, narrative-driven thinker (e.g. INFP / INFJ / High Openness)',
    userSampleResponse: '"I walked past the old conservatory greenhouse this morning. Seeing the wild vines wrapping around rusted iron beams made me realize how much we try to impose sterile order on things that inherently need space to sprawl. It echoed how I\'ve been feeling about my career boundaries lately."',
    rigidQuestion: {
      question: '"What exact time did your walk end, and what are the next 3 items on your calendar today?"',
      flaw: 'Completely ignores the user\'s creative metaphor. Reduces rich psychological introspection down to a cold bureaucratic checklist, leaving the user feeling unseen.'
    },
    adaptedQuestion: {
      question: '"That imagery captures the tension perfectly. When you look at that \'overgrown sprawl\' in your career right now, what part of your instinct feels most suffocated by the rigid structures you\'ve built around it?"',
      advantage: 'Validates their symbolic thinking and leans into the metaphor. Deepens the inquiry without interrupting their natural narrative flow.'
    },
    flowImpact: 'Fosters profound conversational intimacy and psychological safety, unlocking honest self-disclosure.',
    analysisAccuracyImpact: 'Directly validates High Openness to Experience and dominant Intuition (Ni/Ne), measuring cognitive function hierarchy through authentic linguistic patterns instead of synthetic questionnaire ratings.',
    cognitiveFunctionsTargeted: ['Introverted Intuition (Ni)', 'Introverted Feeling (Fi)', 'High Openness']
  },
  {
    id: 'analytical-systems',
    title: 'Analytical & Trade-Off Centric',
    category: 'Logical & Systems Adaptation',
    userArchetype: 'Systems architect / objective strategist (e.g. INTP / INTJ / High Need for Cognition)',
    userSampleResponse: '"We had an architecture debate today. Marketing wanted quick shortcuts to launch by Friday, but our models project a 40% latency spike by next quarter if we don\'t refactor the core schema first. It\'s an obvious systemic mistake."',
    rigidQuestion: {
      question: '"Did it hurt your feelings that marketing didn\'t embrace your heart\'s intention?"',
      flaw: 'Misidentifies a rigorous mathematical/systemic disagreement as emotional hurt. Alienates analytical thinkers by projecting drama where there is structural conviction.'
    },
    adaptedQuestion: {
      question: '"When they weigh short-term marketing velocity against systemic technical debt, what leverage or metrics do you use to shift consensus—or do you let the experiment fail to prove the architectural flaw?"',
      advantage: 'Meets the user at their cognitive level. Explores decision theory, influence strategy, and systemic conviction in terms of trade-offs and feedback loops.'
    },
    flowImpact: 'Establishes mutual intellectual respect; avoids condescending therapy-speak and draws out detailed tactical reasoning.',
    analysisAccuracyImpact: 'Distinguishes between Introverted Thinking (Ti - internal structural consistency) and Extraverted Thinking (Te - organizational leverage), accurately calibrating Agreeableness vs Assertiveness.',
    cognitiveFunctionsTargeted: ['Introverted Thinking (Ti)', 'Extraverted Thinking (Te)', 'Low Agreeableness / High Assertiveness']
  },
  {
    id: 'empathetic-relational',
    title: 'Empathetic & Interpersonal',
    category: 'Harmonizing & Social Adaptation',
    userArchetype: 'People-attuned, relationship-centered collaborator (e.g. ENFJ / ESFJ / High Agreeableness)',
    userSampleResponse: '"A colleague seemed really withdrawn and quiet in our morning standup. I could sense something outside of work was pulling at them, so I sent a gentle note afterward, but I worried about overstepping their personal privacy."',
    rigidQuestion: {
      question: '"Did their lack of participation reduce the team\'s total billable sprint velocity?"',
      flaw: 'Hyper-utilitarian and tone-deaf. Treats an interpersonal concern as a mere transactional bottleneck, causing the user to feel misunderstood.'
    },
    adaptedQuestion: {
      question: '"That speaks to how instinctively you pick up on subtle emotional shifts in the room. When you sent that note, how did you balance offering genuine warmth while keeping the door open for them to maintain their space?"',
      advantage: 'Validates their high emotional intelligence and social sensitivity, while inquiring into how they navigate interpersonal boundaries and relational care.'
    },
    flowImpact: 'Creates immediate warmth and reassurance, allowing the user to reflect deeply on their social roles.',
    analysisAccuracyImpact: 'Uncovers the authentic nuances of Extraverted Feeling (Fe) and High Agreeableness, differentiating between healthy empathy and codependent boundary struggles.',
    cognitiveFunctionsTargeted: ['Extraverted Feeling (Fe)', 'High Agreeableness', 'High Emotional Intelligence']
  }
];
