// 테스트용 주가 데이터 정의

export interface StockPrice {
  date: string;
  close: number;
  high: number;
  low: number;
}

export interface Portfolio {
  cash: number;
  shares: number;
}

export interface Trade {
  type: "buy" | "sell";
  quantity: number;
  price: number;
  total: number;
  commission: number;
}

export const mockStockPrices: StockPrice[] = [
  { date: "2024-01-01", close: 1000, high: 1020, low: 980 }, // 기준일
  { date: "2024-01-02", close: 1050, high: 1070, low: 1000 }, // 5% 상승
  { date: "2024-01-03", close: 1100, high: 1130, low: 1050 }, // 4.76% 상승
  { date: "2024-01-04", close: 1045, high: 1100, low: 1020 }, // 5% 하락
  { date: "2024-01-05", close: 990, high: 1045, low: 980 }, // 5.26% 하락
  { date: "2024-01-06", close: 950, high: 1000, low: 940 }, // 4.04% 하락
];

// 테스트용 포트폴리오 기본값
export const DEFAULT_PORTFOLIO: Portfolio = {
  cash: 1000000,
  shares: 100,
};

// 수수료율
export const COMMISSION_RATE = 0.0025; // 0.25%
