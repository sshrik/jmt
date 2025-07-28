import type { StockData, StockInfo, StockSummary } from "../types/backtest";

// 주식 목록 조회
export async function getStockList(): Promise<StockInfo[]> {
  try {
    const response = await fetch("/data/stocks/stock-list.json");
    if (!response.ok) {
      throw new Error(`주식 목록 조회 실패: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error("주식 목록 로드 실패:", error);
    throw error;
  }
}

// 특정 종목 데이터 조회
export async function getStockData(symbol: string): Promise<StockData> {
  try {
    // 심볼에서 점(.)을 언더스코어(_)로 변경
    const filename = symbol.replace(".", "_") + ".json";
    const response = await fetch(`/data/stocks/${filename}`);

    if (!response.ok) {
      throw new Error(`주식 데이터 조회 실패: ${response.status}`);
    }

    const stockData: StockData = await response.json();

    // 데이터 검증
    if (!stockData.info || !stockData.prices || stockData.prices.length === 0) {
      throw new Error(`잘못된 주식 데이터 형식: ${symbol}`);
    }

    return stockData;
  } catch (error) {
    console.error(`주식 데이터 로드 실패 (${symbol}):`, error);
    throw error;
  }
}

// 여러 종목 데이터 동시 조회
export async function getMultipleStockData(
  symbols: string[]
): Promise<Map<string, StockData>> {
  const dataMap = new Map<string, StockData>();
  const promises = symbols.map((symbol) =>
    getStockData(symbol).then((data) => ({ symbol, data }))
  );

  try {
    const results = await Promise.allSettled(promises);

    results.forEach((result, index) => {
      if (result.status === "fulfilled") {
        dataMap.set(result.value.symbol, result.value.data);
      } else {
        console.warn(`${symbols[index]} 데이터 로드 실패:`, result.reason);
      }
    });

    return dataMap;
  } catch (error) {
    console.error("여러 주식 데이터 로드 실패:", error);
    throw error;
  }
}

// 날짜 범위로 주식 데이터 필터링
export function filterStockDataByDateRange(
  stockData: StockData,
  startDate: string,
  endDate: string
): StockData {
  const filteredPrices = stockData.prices.filter(
    (price) => price.date >= startDate && price.date <= endDate
  );

  return {
    ...stockData,
    prices: filteredPrices,
    startDate,
    endDate,
  };
}

// 주식 데이터 요약 정보
export function getStockDataSummary(stockData: StockData): StockSummary | null {
  const prices = stockData.prices;
  if (prices.length === 0) {
    return null;
  }

  const firstPrice = prices[0];
  const lastPrice = prices[prices.length - 1];
  const totalReturn =
    ((lastPrice.close - firstPrice.close) / firstPrice.close) * 100;

  const high = Math.max(...prices.map((p) => p.high));
  const low = Math.min(...prices.map((p) => p.low));
  const avgVolume =
    prices.reduce((sum, p) => sum + p.volume, 0) / prices.length;

  // 변동성 계산
  const dailyReturns = prices.slice(1).map((price, i) => {
    const prevPrice = prices[i];
    return (price.close - prevPrice.close) / prevPrice.close;
  });

  const avgReturn =
    dailyReturns.reduce((sum, ret) => sum + ret, 0) / dailyReturns.length;
  const variance =
    dailyReturns.reduce((sum, ret) => sum + Math.pow(ret - avgReturn, 2), 0) /
    dailyReturns.length;
  const volatility = Math.sqrt(variance) * Math.sqrt(252) * 100; // 연간 변동성 (%)

  return {
    symbol: stockData.info.symbol,
    name: stockData.info.name,
    startDate: firstPrice.date,
    endDate: lastPrice.date,
    startPrice: firstPrice.close,
    endPrice: lastPrice.close,
    totalReturn,
    high,
    low,
    avgVolume,
    volatility,
    dataPoints: prices.length,
  };
}

// 주식 심볼 유효성 검사
export function isValidStockSymbol(symbol: string): boolean {
  // 기본적인 심볼 형식 검사
  const symbolPattern = /^[A-Z0-9]+(\.[A-Z]{2})?$/;
  return symbolPattern.test(symbol);
}

// 주식 데이터 캐시 (간단한 메모리 캐시)
const stockDataCache = new Map<
  string,
  { data: StockData; timestamp: number }
>();
const CACHE_DURATION = 5 * 60 * 1000; // 5분

export async function getCachedStockData(symbol: string): Promise<StockData> {
  const cached = stockDataCache.get(symbol);
  const now = Date.now();

  // 캐시가 있고 유효하면 반환
  if (cached && now - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }

  // 캐시가 없거나 만료되었으면 새로 로드
  const data = await getStockData(symbol);
  stockDataCache.set(symbol, { data, timestamp: now });

  return data;
}

// 캐시 지우기
export function clearStockDataCache(): void {
  stockDataCache.clear();
}
