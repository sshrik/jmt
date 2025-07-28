// Yahoo Finance 데이터 수집 스크립트
import yahooFinance from "yahoo-finance2";
import fs from "fs/promises";
import path from "path";

// 한국 주요 종목들 (예시)
const KOREAN_STOCKS = [
  { symbol: "005930.KS", name: "삼성전자", market: "KOSPI" },
  { symbol: "000660.KS", name: "SK하이닉스", market: "KOSPI" },
  { symbol: "035420.KS", name: "NAVER", market: "KOSPI" },
  { symbol: "005380.KS", name: "현대차", market: "KOSPI" },
  { symbol: "051910.KS", name: "LG화학", market: "KOSPI" },
  { symbol: "035720.KS", name: "카카오", market: "KOSPI" },
];

// 미국 주요 종목들 (예시)
const US_STOCKS = [
  { symbol: "AAPL", name: "Apple Inc.", market: "NASDAQ" },
  { symbol: "MSFT", name: "Microsoft Corporation", market: "NASDAQ" },
  { symbol: "GOOGL", name: "Alphabet Inc.", market: "NASDAQ" },
  { symbol: "TSLA", name: "Tesla, Inc.", market: "NASDAQ" },
  { symbol: "NVDA", name: "NVIDIA Corporation", market: "NASDAQ" },
  { symbol: "AMZN", name: "Amazon.com, Inc.", market: "NASDAQ" },
];

async function fetchStockData(symbol, name, market, startDate, endDate) {
  try {
    console.log(`📊 ${symbol} (${name}) 데이터 수집 중...`);

    const result = await yahooFinance.historical(symbol, {
      period1: startDate,
      period2: endDate,
      interval: "1d", // 일봉
    });

    const prices = result.map((item) => ({
      date: item.date.toISOString().split("T")[0], // YYYY-MM-DD 형태
      open: item.open,
      high: item.high,
      low: item.low,
      close: item.close,
      volume: item.volume,
      adjClose: item.adjClose,
    }));

    return {
      info: {
        symbol,
        name,
        market,
        currency: market.includes("KS") ? "KRW" : "USD",
      },
      prices,
      startDate: startDate.toISOString().split("T")[0],
      endDate: endDate.toISOString().split("T")[0],
      dataSource: "yahoo",
    };
  } catch (error) {
    console.error(`❌ ${symbol} 데이터 수집 실패:`, error.message);
    return null;
  }
}

async function ensureDirectoryExists(dirPath) {
  try {
    await fs.access(dirPath);
  } catch {
    await fs.mkdir(dirPath, { recursive: true });
  }
}

async function saveStockData(stockData, dataDir) {
  if (!stockData) return;

  const filename = `${stockData.info.symbol.replace(".", "_")}.json`;
  const filepath = path.join(dataDir, filename);

  await fs.writeFile(filepath, JSON.stringify(stockData, null, 2));
  console.log(`💾 ${stockData.info.symbol} 데이터 저장 완료: ${filepath}`);
}

async function main() {
  // 날짜 설정 (최근 2년 데이터)
  const endDate = new Date();
  const startDate = new Date();
  startDate.setFullYear(endDate.getFullYear() - 2);

  console.log(
    `📅 수집 기간: ${startDate.toISOString().split("T")[0]} ~ ${endDate.toISOString().split("T")[0]}`
  );

  // 데이터 저장 디렉토리 생성
  const dataDir = path.join(process.cwd(), "public", "data", "stocks");
  await ensureDirectoryExists(dataDir);

  // 모든 종목 데이터 수집
  const allStocks = [...KOREAN_STOCKS, ...US_STOCKS];

  console.log(`🚀 총 ${allStocks.length}개 종목 데이터 수집 시작...`);

  for (const stock of allStocks) {
    const stockData = await fetchStockData(
      stock.symbol,
      stock.name,
      stock.market,
      startDate,
      endDate
    );

    if (stockData) {
      await saveStockData(stockData, dataDir);
    }

    // API 호출 제한을 위한 딜레이 (1초)
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  // 종목 목록 저장
  const stockList = allStocks.map((stock) => ({
    symbol: stock.symbol,
    name: stock.name,
    market: stock.market,
    currency: stock.market.includes("KS") ? "KRW" : "USD",
    dataFile: `${stock.symbol.replace(".", "_")}.json`,
  }));

  const stockListPath = path.join(dataDir, "stock-list.json");
  await fs.writeFile(stockListPath, JSON.stringify(stockList, null, 2));

  console.log("✅ 모든 데이터 수집 완료!");
  console.log(`📁 데이터 저장 위치: ${dataDir}`);
  console.log(`📋 종목 목록: ${stockListPath}`);
}

// 스크립트 실행
main().catch(console.error);
