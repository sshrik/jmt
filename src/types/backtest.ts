// 주식 가격 데이터 (OHLCV)
export interface StockPrice {
  date: string; // YYYY-MM-DD 형태
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  adjClose?: number; // 수정 종가
}

// 주식 정보
export interface StockInfo {
  symbol: string; // 종목 코드
  name: string; // 종목명
  market: string; // 시장 (KOSPI, KOSDAQ 등)
  currency: string; // 통화
}

// 주식 데이터 (가격 + 정보)
export interface StockData {
  info: StockInfo;
  prices: StockPrice[];
  startDate: string;
  endDate: string;
  dataSource: "yahoo" | "mock" | "api";
}

// 백테스트 설정
export interface BacktestConfig {
  symbol: string;
  startDate: string;
  endDate: string;
  initialCash: number;
  commission: number; // 수수료율 (0.001 = 0.1%)
  slippage: number; // 슬리피지율 (0.001 = 0.1%)
}

// 거래 기록
export interface Trade {
  id: string;
  date: string;
  type: "buy" | "sell";
  symbol: string;
  quantity: number;
  price: number;
  commission: number;
  total: number; // 수수료 포함 총액
}

// 포트폴리오 스냅샷 (특정 시점의 상태)
export interface PortfolioSnapshot {
  date: string;
  cash: number;
  positions: {
    symbol: string;
    quantity: number;
    avgPrice: number;
    currentPrice: number;
    marketValue: number;
    unrealizedPnL: number;
  }[];
  totalValue: number;
  totalReturn: number;
  totalReturnPct: number;
}

// 백테스트 통계
export interface BacktestStats {
  totalReturn: number;
  totalReturnPct: number;
  annualizedReturn: number;
  volatility: number;
  sharpeRatio: number;
  maxDrawdown: number;
  maxDrawdownDuration: number; // 일수
  winRate: number;
  profitFactor: number;
  totalTrades: number;
  avgTradeReturn: number;
}

// 백테스트 결과
export interface BacktestResult {
  config: BacktestConfig;
  trades: Trade[];
  portfolioHistory: PortfolioSnapshot[];
  stats: BacktestStats;
  startDate: string;
  endDate: string;
  duration: number; // 백테스트 기간 (일수)
  executionTime: number; // 실행 시간 (ms)
}

// 백테스트 진행 상태
export interface BacktestProgress {
  current: number;
  total: number;
  currentDate: string;
  status: "preparing" | "running" | "completed" | "error";
  message?: string;
}
