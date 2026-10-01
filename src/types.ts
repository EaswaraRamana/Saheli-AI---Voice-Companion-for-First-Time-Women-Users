export type LanguageCode = 'hi' | 'ta' | 'te' | 'bn' | 'mr' | 'gu' | 'kn' | 'ml' | 'pa' | 'en';

export interface VisualDocument {
  id: string;
  name: Record<string, string> | string;
  icon: 'id-card' | 'wallet' | 'file-text' | 'camera' | 'phone';
  description: Record<string, string> | string;
  visualPreviewText?: string;
  audioExplanation: Record<string, string>;
}

export interface Scheme {
  id: string;
  category: 'skill_machine' | 'lpg_gas' | 'savings_daughter' | 'business_loan' | 'maternity_money' | 'health_card';
  title: Record<string, string>;
  benefitBadge: Record<string, string>;
  benefits: Record<string, string>;
  eligibility: Record<string, string>;
  visualDocuments: VisualDocument[];
  whereToGo: Record<string, string>;
  officerVoiceScript: Record<string, string>;
  audioGreeting: Record<string, string>;
  stepByStepGuide: {
    step: number;
    title: Record<string, string>;
    desc: Record<string, string>;
  }[];
}

export interface DocumentInspectionResult {
  documentType: string;
  simpleStatus: 'APPROVED' | 'PENDING' | 'INFORMATION_ONLY' | 'ACTION_NEEDED';
  spokenExplanation: string;
  keyDetails: { label: string; value: string }[];
  nextStepInstruction: string;
}

export interface RecentConversation {
  id: string;
  schemeId: string;
  userQuery: string;
  aiResponse: string;
  timestamp: string;
}

