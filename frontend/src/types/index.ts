// ============================================================
// Analysis types
// ============================================================

export interface AnalyzeRequest {
  jobDescription: string;
  resumeContent: string;
  atsPlatform: string;
  jobTitle?: string;
  company?: string;
  saveToHistory?: boolean;
}

export interface Dimension {
  label: string;
  score: number;
  weight: number;
}

export interface Keywords {
  matched: string[];
  missing: string[];
  weak: string[];
}

export interface Actions {
  high: string[];
  medium: string[];
  low: string[];
}

export interface LatexEdit {
  where: string;
  change: string;
  snippet: string;
}

export interface AnalyzeResponse {
  historyId?: string;
  overallScore: number;
  atsPassProbability: number;
  verdict: 'STRONG MATCH' | 'MODERATE MATCH' | 'WEAK MATCH' | 'DO NOT APPLY';
  verdictTitle: string;
  verdictSub: string;
  atsNote: string;
  dimensions: Dimension[];
  keywords: Keywords;
  rejectionFlags: string[];
  actions: Actions;
  latexEdits: LatexEdit[];
}

// ============================================================
// Template types
// ============================================================

export interface JdTemplate {
  id: string;
  name: string;
  content: string;
  atsPlatform: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTemplateRequest {
  name: string;
  content: string;
  atsPlatform: string;
}

// ============================================================
// History types
// ============================================================

export interface HistorySummary {
  id: string;
  jobTitle?: string;
  company?: string;
  atsPlatform: string;
  overallScore?: number;
  verdict?: string;
  createdAt: string;
}

export interface HistoryDetail extends HistorySummary {
  resultJson: AnalyzeResponse;
}

export interface PagedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  last: boolean;
}

// ============================================================
// ATS platform types
// ============================================================

export interface AtsPlatform {
  id: string;
  name: string;
  tier: string;
}

export const ATS_PLATFORMS: AtsPlatform[] = [
  { id: 'workday', name: 'Workday', tier: 'Enterprise' },
  { id: 'taleo', name: 'Taleo', tier: 'Oracle / Enterprise' },
  { id: 'icims', name: 'iCIMS', tier: 'Enterprise' },
  { id: 'successfactors', name: 'SAP SuccessFactors', tier: 'Enterprise' },
  { id: 'greenhouse', name: 'Greenhouse', tier: 'Mid-market' },
  { id: 'lever', name: 'Lever', tier: 'Mid-market' },
  { id: 'smartrecruiters', name: 'SmartRecruiters', tier: 'Mid-market' },
  { id: 'jobvite', name: 'Jobvite', tier: 'Mid-market' },
  { id: 'bamboohr', name: 'BambooHR', tier: 'SMB / Mid' },
  { id: 'adp', name: 'ADP Workforce Now', tier: 'Enterprise' },
  { id: 'bullhorn', name: 'Bullhorn', tier: 'Staffing' },
  { id: 'avature', name: 'Avature', tier: 'Enterprise CRM' },
  { id: 'jazzhr', name: 'JazzHR', tier: 'SMB' },
  { id: 'rippling', name: 'Rippling', tier: 'Mid-market' },
  { id: 'teamtailor', name: 'Teamtailor', tier: 'Mid-market' },
  { id: 'unknown', name: 'Unknown / Other', tier: 'Generic rules' },
];

export type VerdictType = AnalyzeResponse['verdict'];

export const VERDICT_CONFIG: Record<VerdictType, { bg: string; text: string; border: string }> = {
  'STRONG MATCH':   { bg: 'bg-green-50',  text: 'text-green-700',  border: 'border-green-200' },
  'MODERATE MATCH': { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200' },
  'WEAK MATCH':     { bg: 'bg-red-50',    text: 'text-red-700',    border: 'border-red-200' },
  'DO NOT APPLY':   { bg: 'bg-red-50',    text: 'text-red-700',    border: 'border-red-200' },
};
