// 조건 타입 정의
export type ConditionType =
  | "price_change_percent" // 전일가 대비 %변화
  | "profit_loss_percent" // 수익률 달성
  | "consecutive_days" // 연속 상승/하락
  | "moving_average_cross" // 이동평균 교차
  | "rsi_threshold"; // RSI 임계값

// 액션 타입 정의
export type ActionType =
  | "buy_percent_cash" // 현금의 %만큼 매수
  | "sell_percent_stock" // 주식의 %만큼 매도
  | "buy_fixed_amount" // 고정 금액 매수
  | "sell_fixed_amount" // 고정 금액 매도
  | "hold" // 대기
  | "stop_loss" // 손절
  | "take_profit"; // 익절

// 조건 파라미터
export interface ConditionParameters {
  // 전일가 대비 변화
  priceChangePercent?: number; // 5 (5% 변화)
  priceChangeDirection?: "up" | "down"; // 상승/하락

  // 수익률
  profitLossPercent?: number; // 10 (10% 수익)
  profitLossType?: "profit" | "loss"; // 수익/손실

  // 연속 일수
  consecutiveDays?: number; // 3 (3일)
  consecutiveDirection?: "up" | "down"; // 상승/하락

  // 이동평균
  maShort?: number; // 5일 이동평균
  maLong?: number; // 20일 이동평균
  maCrossDirection?: "golden" | "dead"; // 골든크로스/데드크로스

  // RSI
  rsiValue?: number; // 70 (RSI 값)
  rsiCondition?: "above" | "below"; // 이상/이하
}

// 액션 파라미터
export interface ActionParameters {
  // 퍼센트 기반
  percentCash?: number; // 30 (현금의 30%)
  percentStock?: number; // 50 (주식의 50%)

  // 고정 금액
  fixedAmount?: number; // 1000000 (100만원)

  // 손절/익절
  stopLossPercent?: number; // 5 (5% 손실시)
  takeProfitPercent?: number; // 10 (10% 수익시)
}

// 전략 블록 인터페이스
export interface StrategyBlock {
  id: string;
  type: "condition" | "action";
  name: string; // 사용자 정의 이름
  description?: string; // 설명

  // 조건 블록용
  conditionType?: ConditionType;
  conditionParams?: ConditionParameters;

  // 액션 블록용
  actionType?: ActionType;
  actionParams?: ActionParameters;

  // 플로우 연결용 (Phase 2에서 활용)
  connections?: string[]; // 연결된 블록 ID들
  position?: { x: number; y: number }; // UI 위치 (드래그앤드롭용)

  // 메타데이터
  createdAt: Date;
  updatedAt: Date;
  enabled: boolean; // 활성화/비활성화
}

// 전략 구성
export interface Strategy {
  id: string;
  projectId: string;
  versionId: string;
  name: string;
  description?: string;

  blocks: StrategyBlock[]; // 전략 블록들
  blockOrder: string[]; // 실행 순서 (Phase 1용)

  // 메타데이터
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

// 전략 실행 결과
export interface StrategyExecution {
  id: string;
  strategyId: string;
  timestamp: Date;

  // 실행된 블록
  executedBlocks: {
    blockId: string;
    result: "executed" | "skipped" | "failed";
    reason?: string;
    data?: Record<string, unknown>;
  }[];

  // 결과
  action?: {
    type: ActionType;
    amount: number;
    price: number;
    success: boolean;
  };
}

// UI 헬퍼 타입들
export interface ConditionBlockProps {
  block: StrategyBlock;
  onUpdate: (block: StrategyBlock) => void;
  onDelete: (blockId: string) => void;
  readOnly?: boolean;
}

export interface ActionBlockProps {
  block: StrategyBlock;
  onUpdate: (block: StrategyBlock) => void;
  onDelete: (blockId: string) => void;
  readOnly?: boolean;
}

// 블록 템플릿 (자주 사용되는 패턴들)
export const STRATEGY_TEMPLATES = {
  SIMPLE_MOMENTUM: {
    name: "단순 모멘텀 전략",
    description: "전일가 대비 상승시 매수, 하락시 매도",
    blocks: [
      // 템플릿 블록들이 들어갈 예정
    ],
  },

  MEAN_REVERSION: {
    name: "평균 회귀 전략",
    description: "RSI 과매수/과매도 구간에서 역방향 매매",
    blocks: [],
  },

  MOVING_AVERAGE: {
    name: "이동평균 전략",
    description: "골든크로스/데드크로스 기반 매매",
    blocks: [],
  },
} as const;
