import type { StockData, StockInfo, StockSummary } from "../types/backtest";

// 새로운 자산 목록 구조
interface AssetList {
  categories: {
    한국주식: StockInfo[];
    미국주식: StockInfo[];
    지수: StockInfo[];
    암호화폐: StockInfo[];
  };
  metadata: {
    generatedAt: string;
    totalAssets: number;
    successCount: number;
    failureCount: number;
    dataSource: string;
    maxHistoryYears: number;
  };
}

// 자산 목록 조회 (모든 카테고리)
export async function getAssetList(): Promise<AssetList> {
  try {
    const response = await fetch("/data/stocks/asset-list.json");
    if (!response.ok) {
      throw new Error(`자산 목록 조회 실패: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error("자산 목록 로드 실패:", error);
    throw error;
  }
}

// 주식 목록 조회 (기존 호환성을 위해 유지)
export async function getStockList(): Promise<StockInfo[]> {
  try {
    const assetList = await getAssetList();
    // 한국주식과 미국주식만 반환 (기존 호환성)
    return [
      ...assetList.categories["한국주식"],
      ...assetList.categories["미국주식"],
    ];
  } catch (error) {
    console.error("주식 목록 로드 실패:", error);
    throw error;
  }
}

// 카테고리별 자산 목록 조회
export async function getAssetsByCategory(
  category: keyof AssetList["categories"]
): Promise<StockInfo[]> {
  try {
    const assetList = await getAssetList();
    return assetList.categories[category] || [];
  } catch (error) {
    console.error(`${category} 자산 목록 로드 실패:`, error);
    throw error;
  }
}

// 모든 자산 목록 조회 (평면화)
export async function getAllAssets(): Promise<StockInfo[]> {
  try {
    const assetList = await getAssetList();
    return [
      ...assetList.categories["한국주식"],
      ...assetList.categories["미국주식"],
      ...assetList.categories["지수"],
      ...assetList.categories["암호화폐"],
    ];
  } catch (error) {
    console.error("전체 자산 목록 로드 실패:", error);
    throw error;
  }
}

// 자산 검색 (이름 또는 심볼로)
export async function searchAssets(query: string): Promise<StockInfo[]> {
  try {
    const allAssets = await getAllAssets();
    const lowerQuery = query.toLowerCase();

    return allAssets.filter(
      (asset) =>
        asset.name.toLowerCase().includes(lowerQuery) ||
        asset.symbol.toLowerCase().includes(lowerQuery)
    );
  } catch (error) {
    console.error("자산 검색 실패:", error);
    throw error;
  }
}

// 특정 종목 데이터 조회
export async function getStockData(symbol: string): Promise<StockData> {
  try {
    // 심볼에서 특수문자를 언더스코어(_)로 변경
    const filename = symbol.replace(/[\^.]/g, "_") + ".json";
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

// 자산 심볼 유효성 검사 (확장됨)
export function isValidAssetSymbol(symbol: string): boolean {
  // 주식, 지수, 암호화폐 심볼 형식 검사
  const patterns = [
    /^[A-Z0-9]+(\.[A-Z]{2})?$/, // 일반 주식 (AAPL, 005930.KS)
    /^\^[A-Z0-9]+$/, // 지수 (^GSPC, ^KS11)
    /^[A-Z]+-USD$/, // 암호화폐 (BTC-USD, ETH-USD)
  ];

  return patterns.some((pattern) => pattern.test(symbol));
}

// 자산 타입 판별
export function getAssetType(
  symbol: string
): "stock" | "index" | "crypto" | "unknown" {
  if (symbol.startsWith("^")) return "index";
  if (symbol.includes("-USD")) return "crypto";
  if (symbol.includes(".") || /^[A-Z0-9]+$/.test(symbol)) return "stock";
  return "unknown";
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

// S&P 500 지수 데이터 조회 (편의 함수)
export async function getSP500Data(): Promise<StockData> {
  return await getStockData("^GSPC");
}

// KOSPI 지수 데이터 조회 (편의 함수)
export async function getKOSPIData(): Promise<StockData> {
  return await getStockData("^KS11");
}

// 데이터 메타데이터 조회
export async function getDataMetadata() {
  try {
    const assetList = await getAssetList();
    return assetList.metadata;
  } catch (error) {
    console.error("데이터 메타데이터 로드 실패:", error);
    throw error;
  }
}
