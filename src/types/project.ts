// 기본 데이터 타입들
export interface Project {
  id: string;
  name: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
  versions: Version[];
}

export interface Version {
  id: string;
  projectId: string;
  versionName: string; // "v1.0", "v1.1" etc.
  description: string;
  createdAt: Date;
  strategy: StrategyBlock[];
  backtestResults?: BacktestResult;
}

// 투자 전략 블록 시스템
export type StrategyBlock = ConditionBlock | ActionBlock | ConnectionBlock;

export interface BaseBlock {
  id: string;
  type: "condition" | "action" | "connection";
  position: { x: number; y: number };
  connections: string[]; // 연결된 블록 ID들
}

// 조건 블록 (전일가 기준 조건)
export interface ConditionBlock extends BaseBlock {
  type: "condition";
  conditionType: "price_comparison" | "percentage_change";
  config: PriceConditionConfig | PercentageConditionConfig;
}

export interface PriceConditionConfig {
  basePrice:
    | "previous_close"
    | "previous_high"
    | "previous_low"
    | "current_price";
  operator: "greater_than" | "less_than" | "greater_equal" | "less_equal";
  targetValue: number;
  label: string; // "전일 종가 대비 1000원 이상 상승시"
}

export interface PercentageConditionConfig {
  basePrice: "previous_close" | "previous_high" | "previous_low";
  operator: "greater_than" | "less_than";
  percentage: number; // 퍼센트 값
  label: string; // "전일 종가 대비 5% 이상 상승시"
}

// 액션 블록 (매수/매도 행동)
export interface ActionBlock extends BaseBlock {
  type: "action";
  actionType: "buy" | "sell" | "hold";
  config: BuyActionConfig | SellActionConfig | HoldActionConfig;
}

export interface BuyActionConfig {
  amountType: "fixed_amount" | "percentage_of_cash" | "all_cash";
  amount?: number; // fixed_amount일 때 사용
  percentage?: number; // percentage_of_cash일 때 사용 (0-100)
  label: string; // "보유 현금의 50% 매수"
}

export interface SellActionConfig {
  amountType: "fixed_amount" | "percentage_of_stocks" | "all_stocks";
  amount?: number; // fixed_amount일 때 주식 수량
  percentage?: number; // percentage_of_stocks일 때 사용 (0-100)
  label: string; // "보유 주식의 30% 매도"
}

export interface HoldActionConfig {
  label: string; // "대기"
}

// 연결 블록 (블록 간 흐름 제어)
export interface ConnectionBlock extends BaseBlock {
  type: "connection";
  connectionType: "and" | "or" | "then";
  label: string;
}

// 백테스트 결과
export interface BacktestResult {
  id: string;
  versionId: string;
  executedAt: Date;

  // 주요 지표
  totalReturn: number; // 총 수익률 (%)
  maxDrawdown: number; // 최대 낙폭 (%)
  tradeCount: number; // 총 거래 횟수
  winRate: number; // 승률 (%)

  // 상세 결과
  transactions: Transaction[];
  portfolioHistory: PortfolioSnapshot[];

  // 설정 정보
  initialCash: number; // 초기 투자금
  backtestPeriod: {
    startDate: Date;
    endDate: Date;
  };
}

export interface Transaction {
  id: string;
  date: Date;
  type: "buy" | "sell";
  price: number; // 거래 가격
  quantity: number; // 거래 수량
  amount: number; // 거래 금액
  fee: number; // 수수료
  reason: string; // 거래 이유 (어떤 조건에 의해 발생했는지)
}

export interface PortfolioSnapshot {
  date: Date;
  cash: number; // 보유 현금
  stockQuantity: number; // 보유 주식 수량
  stockValue: number; // 주식 평가액
  totalValue: number; // 총 포트폴리오 가치
  dailyReturn: number; // 일일 수익률
}

// UI용 헬퍼 타입들
export interface ProjectSummary {
  id: string;
  name: string;
  description: string;
  lastModified: Date;
  totalVersions: number;
  latestReturn?: number; // 최신 버전의 수익률
}

export interface VersionSummary {
  id: string;
  versionName: string;
  description: string;
  createdAt: Date;
  hasBacktestResults: boolean;
  totalReturn?: number;
}

// 블록 에디터용 타입들
export interface BlockEditorState {
  blocks: StrategyBlock[];
  selectedBlockId?: string;
  isEditing: boolean;
  validationErrors: ValidationError[];
}

export interface ValidationError {
  blockId: string;
  message: string;
  type: "error" | "warning";
}
