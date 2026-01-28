// Authentication Types
export interface User {
  userId: string;
  orgId: string;
  fullName: string;
  email: string;
  businessName: string;
  role: 'Owner' | 'Manager' | 'Staff';
  location?: string;
}

export interface SignUpRequest {
  fullName: string;
  email: string;
  password: string;
  businessName: string;
  role: string;
  location: string;
}

export interface SignInRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  userId: string;
  orgId: string;
  businessName: string;
  role?: string;
  message?: string;
}

// Stats API Types
export interface PulseData {
  period: string;
  revenue: number;
  expenses: number;
  margin_pct: number;
  fact_count: number;
}

export interface TopDriver {
  name: string;
  value: number;
  pct_total: number;
  vector_type: string;
}

export interface Efficiency {
  margin: number;
  totalRevenue: number;
  totalExpenses: number;
  factDensity: number;
  avgConfidence: number;
  physicsCertified: number;
  periodRange: string;
}

export interface ExpenseLeak {
  type: string;
  cost: number;
  pct_burn: number;
  periods_active: number;
}

export interface StatsMetadata {
  org_id: string;
  domain_pattern: 'VOLUME_BASED' | 'SERVICE_BASED' | 'HYBRID';
  hero_category: string;
  category_granularity: number;
  avg_ticket_size: number;
  revenue_concentration: number;
}

export interface LighthouseStats {
  pulse: PulseData[];
  topDrivers: TopDriver[];
  efficiency: Efficiency;
  expenseLeaks: ExpenseLeak[];
  metadata: StatsMetadata;
}

// Chat Types
export interface ReasoningStep {
  step: string;
  message: string;
}

export interface Provenance {
  fact_id: string;
  source: string;
  confidence: number;
}

export interface ChartConfig {
  xAxis: string;
  yAxis: string;
  title?: string;
}

export interface ChartData {
  chartType: 'line' | 'bar' | 'area';
  data: Record<string, unknown>[];
  config: ChartConfig;
}

export interface QueryAction {
  text: string;
  query: string;
}

export type EpistemicMode = 'certified' | 'explore' | 'clarification';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  mode?: EpistemicMode;
  reasoning?: {
    trace: ReasoningStep[];
  };
  chartData?: ChartData;
  provenance?: Provenance[];
  actions?: QueryAction[];
}

export interface QueryRequest {
  userId: string;
  message: string;
  conversationHistory?: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
}

export interface QueryResponse {
  mode: EpistemicMode;
  answer: string;
  reasoning?: {
    trace: ReasoningStep[];
  };
  provenance?: Provenance[];
  chartData?: ChartData;
  actions?: QueryAction[];
  timestamp: string;
}

// Notes Types
export interface Note {
  content: string;
  updatedAt: string;
}

export interface PinnedItem {
  id: string;
  type: 'chart' | 'insight';
  title: string;
  preview?: string;
  data?: ChartData;
}

// Ingest Types
export interface IngestResponse {
  success: boolean;
  certified: number;
  quarantined: number;
  message: string;
}
