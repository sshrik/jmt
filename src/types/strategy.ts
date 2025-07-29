// 조건 타입 정의
export type ConditionType =
  | "always" // 항상
  | "close_price_change" // 전일 종가 대비 변화
  | "high_price_change" // 전일 고가 대비 변화
  | "low_price_change" // 전일 저가 대비 변화
  | "close_price_range" // 종가 변화율 범위 (3% 이상 5% 이하)
  | "high_price_range" // 고가 변화율 범위
  | "low_price_range" // 저가 변화율 범위
  | "price_value_range"; // 절대 가격 범위 (1000원 이상 1500원 이하)

// 액션 타입 정의
export type ActionType =
  | "buy_percent_cash" // 현금의 %만큼 매수
  | "sell_percent_stock" // 주식의 %만큼 매도
  | "buy_fixed_amount" // 고정 금액 매수
  | "sell_fixed_amount" // 고정 금액 매도
  | "buy_shares" // N주 매수
  | "sell_shares" // N주 매도
  | "sell_all" // 100% 판매
  | "buy_formula_amount" // 수식 기반 고정 금액 매수
  | "sell_formula_amount" // 수식 기반 고정 금액 매도
  | "buy_formula_shares" // 수식 기반 주식 수 매수
  | "sell_formula_shares" // 수식 기반 주식 수 매도
  | "buy_formula_percent" // 수식 기반 비율 매수
  | "sell_formula_percent" // 수식 기반 비율 매도
  | "hold"; // 대기

// 조건 파라미터
export interface ConditionParameters {
  // 전일가 대비 변화
  priceChangePercent?: number; // 5 (5% 변화)
  priceChangeDirection?: "up" | "down"; // 상승/하락

  // 범위 조건 (퍼센트)
  minPercent?: number; // 3 (최소 3%)
  maxPercent?: number; // 5 (최대 5%)
  rangeDirection?: "up" | "down" | "both"; // 상승/하락/양방향
  rangeOperator?:
    | "inclusive"
    | "exclusive"
    | "left_inclusive"
    | "right_inclusive"; // 이상이하/초과미만/이상미만/초과이하

  // 절대 가격 범위
  minPrice?: number; // 1000 (최소 1000원)
  maxPrice?: number; // 1500 (최대 1500원)

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

  // 주식 수
  shareCount?: number; // 100 (100주)

  // 수식 기반 (N = 실제 상승/하락 비율)
  formula?: string; // "10000 * N + 2000", "2 * N", "abs(N) * 0.5"
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

// ===== React Flow 기반 플로우 차트 타입 정의 =====

// 플로우 노드 타입
export type FlowNodeType =
  | "start" // 전략 시작점
  | "schedule" // 매수-매도 일정 (언제 실행할지)
  | "condition" // 조건 블록
  | "action" // 액션 블록
  | "end" // 전략 종료점
  | "decision"; // 분기점 (조건에 따른 흐름 분할)

// 스케줄 타입 (언제 실행할지)
export type ScheduleType =
  | "market_open" // 장 시작 시
  | "market_close" // 장 마감 시
  | "interval" // 주기적 (몇 분마다)
  | "daily" // 매일 특정 시간
  | "weekly" // 주간
  | "manual"; // 수동 트리거

// 스케줄 파라미터
export interface ScheduleParameters {
  scheduleType?: ScheduleType;
  intervalMinutes?: number; // interval 타입에서 사용
  executionTime?: string; // "09:30", "15:20" 형태
  weekday?: number; // 0(일요일) ~ 6(토요일)
  description?: string;
}

// 향상된 액션 타입 (투자 종료 포함)
export type EnhancedActionType =
  | ActionType
  | "exit_all" // 모든 포지션 정리 후 투자 종료
  | "pause_strategy" // 전략 일시 정지
  | "alert" // 알림만 발송
  | "log"; // 로그 기록

// 플로우 노드 데이터
export interface FlowNodeData {
  id: string;
  label: string;
  type: FlowNodeType;

  // 노드별 특화 데이터
  scheduleParams?: ScheduleParameters;
  conditionType?: ConditionType;
  conditionParams?: ConditionParameters;
  actionType?: EnhancedActionType;
  actionParams?: ActionParameters;

  // 메타데이터
  description?: string;
  enabled?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

// React Flow 노드 (React Flow 라이브러리와 호환)
export interface StrategyFlowNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: FlowNodeData;
  width?: number;
  height?: number;
}

// React Flow 엣지 (노드 간 연결)
export interface StrategyFlowEdge {
  id: string;
  source: string; // 소스 노드 ID
  target: string; // 타겟 노드 ID
  label?: string; // 엣지 라벨 ("조건 만족", "조건 불만족" 등)
  type?: string; // 엣지 타입
  animated?: boolean;
  style?: Record<string, string | number | boolean>;
}

// 전략 플로우 (React Flow 기반)
export interface StrategyFlow {
  id: string;
  projectId: string;
  versionId: string;
  name: string;
  description?: string;

  // React Flow 데이터
  nodes: StrategyFlowNode[];
  edges: StrategyFlowEdge[];

  // 실행 설정
  executionSettings?: {
    maxConcurrentActions?: number; // 동시 실행 가능한 액션 수
    errorHandling?: "stop" | "continue" | "retry";
    retryCount?: number;
  };

  // 메타데이터
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

// 플로우 실행 컨텍스트
export interface FlowExecutionContext {
  flowId: string;
  currentMarketData?: {
    price: number;
    timestamp: Date;
    volume?: number;
  };
  portfolio?: {
    cash: number;
    holdings: { symbol: string; quantity: number; value: number }[];
  };
  executionHistory?: {
    nodeId: string;
    timestamp: Date;
    result: "success" | "failure" | "skipped";
    data?: Record<string, unknown>;
  }[];
}

// 플로우 실행 결과
export interface FlowExecutionResult {
  executionId: string;
  flowId: string;
  startTime: Date;
  endTime?: Date;
  status: "running" | "completed" | "failed" | "paused";

  nodeResults: {
    nodeId: string;
    nodeType: FlowNodeType;
    executed: boolean;
    result?: Record<string, unknown>;
    error?: string;
    executionTime: Date;
  }[];

  finalActions?: {
    type: EnhancedActionType;
    params: Record<string, unknown>;
    executed: boolean;
    result?: Record<string, unknown>;
  }[];
}
