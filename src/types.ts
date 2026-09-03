export interface TraitExplanation {
  trait: string;
  score: number;
  explanation: string;
}

export interface ActionableInsight {
  title: string;
  insight: string;
}

export interface ReportData {
  mbti?: string;
  enneagram?: string;
  bigFive?: {
    openness?: number;
    conscientiousness?: number;
    extraversion?: number;
    agreeableness?: number;
    neuroticism?: number;
  };
  readiness?: {
    score: number;
    explanation: string;
    correlation: string;
  };
  mbtiFunctions?: {
    dominant: { function: string; explanation: string; example: string };
    auxiliary: { function: string; explanation: string; example: string };
    tertiary: { function: string; explanation: string; example: string };
  };
  casualSummary?: string;
  summary?: string;
  examples?: string[];
  traitExplanations?: TraitExplanation[];
  actionableInsights?: ActionableInsight[];
  communicationStyle?: {
    directness: string;
    formality: string;
    analyticalVsEmotional: string;
    humor: string;
    storytelling: string;
    metaphors: string;
    abstractLanguage: string;
    examples: string[];
    summary: string;
  };
  sentimentAnalysis?: {
    overallSentiment: string;
    shifts: string[];
    summary: string;
  };
}

export interface SavedReport {
  id: string;
  date: string;
  logDate?: string; // YYYY-MM-DD
  report: ReportData;
}

export interface SituationalStrategy {
  situation: string;
  strategy: string;
  traitsLeveraged: string[];
}

export interface JournalPrompt {
  title: string;
  prompt: string;
  why: string;
}

export interface LayeredInsightData {
  surfaceLevel: string;
  underlyingPatterns: string;
  multiplePerspectives: string[];
  potentialScenarios: string[];
  informedDecisions: string[];
}
